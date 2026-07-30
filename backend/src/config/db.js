const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

let isMongo = false;
let isMySQL = false;
let pool = null;

const fallbackFilePath = path.resolve(__dirname, 'fallback_db.json');

// Initialize local JSON DB file if it doesn't exist
if (!fs.existsSync(fallbackFilePath)) {
  fs.writeFileSync(fallbackFilePath, JSON.stringify({
    users: [],
    patients: [],
    scores: [],
    rehab: [],
    reports: [],
    messages: [],
    notifications: []
  }, null, 2));
}

const connectDB = async () => {
  // First try MySQL to connect to the iOS app database
  try {
    const host = process.env.DB_HOST || '127.0.0.1';
    const port = parseInt(process.env.DB_PORT || '100');
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD || '';
    const database = process.env.DB_NAME || 'neuro';

    console.log(`📡 Connecting to MySQL database (neuro) on ${host}:${port}...`);
    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 15,
      queueLimit: 0
    });

    // Test connection
    const conn = await pool.getConnection();
    isMySQL = true;
    console.log('✅ MySQL connected successfully. Using iOS shared database!');
    conn.release();
    global.isMySQL = true;
    global.isMongo = false;
    return;
  } catch (err) {
    isMySQL = false;
    global.isMySQL = false;
    console.warn('⚠️ MySQL connection failed. Trying MongoDB...', err.message);
  }

  // Fallback to MongoDB
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/neuropredict';
  try {
    console.log('📡 Connecting to MongoDB...');
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000
    });
    isMongo = true;
    console.log('✅ MongoDB connected successfully.');
  } catch (err) {
    isMongo = false;
    console.log('⚠️ MongoDB connection failed. Falling back to local file-based database...');
    console.log(`📂 Fallback database path: ${fallbackFilePath}`);
  }
  global.isMongo = isMongo;
};

// Generic execute query helper
async function executeQuery(sql, params) {
  if (!pool) return [];
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// Mock model engine for local JSON DB
class MockModel {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.filePath = fallbackFilePath;
  }

  _read() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data || '{}');
    } catch (e) {
      console.error(`Error reading mock collection ${this.collectionName}:`, e);
      return {};
    }
  }

  _write(db) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(db, null, 2));
    } catch (e) {
      console.error(`Error writing mock collection ${this.collectionName}:`, e);
    }
  }

  _getCollection() {
    const db = this._read();
    if (!db[this.collectionName]) {
      db[this.collectionName] = [];
      this._write(db);
    }
    return db[this.collectionName];
  }

  _saveCollection(items) {
    const db = this._read();
    db[this.collectionName] = items;
    this._write(db);
  }

  _matches(item, query) {
    if (!query) return true;
    for (let key in query) {
      let queryVal = query[key];
      let itemVal = item[key];

      if (queryVal && typeof queryVal === 'object' && !Array.isArray(queryVal)) {
        if (queryVal.$regex) {
          const regex = new RegExp(queryVal.$regex, queryVal.$options || '');
          if (!regex.test(itemVal)) return false;
        } else {
          if (JSON.stringify(itemVal) !== JSON.stringify(queryVal)) return false;
        }
      } else {
        if (typeof itemVal === 'string' && typeof queryVal === 'string') {
          if (itemVal.toLowerCase() !== queryVal.toLowerCase()) return false;
        } else {
          if (itemVal != queryVal) return false;
        }
      }
    }
    return true;
  }

  async find(query = {}) {
    const items = this._getCollection();
    return items.filter(item => this._matches(item, query));
  }

  async findOne(query = {}) {
    const items = this._getCollection();
    return items.find(item => this._matches(item, query)) || null;
  }

  async findById(id) {
    const items = this._getCollection();
    return items.find(item => item._id === id || item.id === id || item.patient_id === id || item.doctor_id === id) || null;
  }

  async create(data) {
    const items = this._getCollection();
    const newDoc = {
      _id: Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      ...data
    };
    items.push(newDoc);
    this._saveCollection(items);
    return newDoc;
  }

  async findOneAndUpdate(query, update, options = {}) {
    const items = this._getCollection();
    const index = items.findIndex(item => this._matches(item, query));
    if (index === -1) {
      if (options.upsert) {
        return this.create({ ...query, ...update });
      }
      return null;
    }
    const current = items[index];
    const updateData = update.$set || update;
    const updated = { ...current, ...updateData };
    items[index] = updated;
    this._saveCollection(items);
    return updated;
  }

  async findByIdAndUpdate(id, update, options = {}) {
    return this.findOneAndUpdate({ _id: id }, update, options);
  }

  async deleteOne(query) {
    const items = this._getCollection();
    const index = items.findIndex(item => this._matches(item, query));
    if (index !== -1) {
      items.splice(index, 1);
      this._saveCollection(items);
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }

  async findByIdAndDelete(id) {
    return this.deleteOne({ _id: id });
  }

  async countDocuments(query = {}) {
    const items = await this.find(query);
    return items.length;
  }
}

// MySQL model engine linking directly to XAMPP tables
class MySQLModel {
  constructor(name) {
    this.modelName = name;
  }

  getTable(query) {
    if (this.modelName === 'User') {
      if (query) {
        if (query.role === 'doctor' || query.doctor_id) return 'clinicians';
        if (query.role === 'patient' || query.patient_id) return 'patients';
        if (query.$or) {
          const hasDocId = query.$or.some(q => q.doctor_id || q.role === 'doctor');
          const hasPatId = query.$or.some(q => q.patient_id || q.role === 'patient');
          if (hasPatId) return 'patients';
          if (hasDocId) return 'clinicians';
        }
      }
      return 'clinicians';
    }
    if (this.modelName === 'Patient') return 'patients';
    if (this.modelName === 'PatientScores') return 'patient_scores';
    if (this.modelName === 'Rehab') return 'rehab';
    if (this.modelName === 'Report') return 'reports';
    if (this.modelName === 'Message') return 'messages';
    if (this.modelName === 'Notification') return 'alerts';
    return '';
  }

  buildWhere(query) {
    const table = this.getTable(query);
    const conditions = [];
    const params = [];

    for (let key in query) {
      if (key === 'role') continue;

      let val = query[key];
      let col = key;

      if (table === 'patients') {
        if (key === 'dob') col = 'date_of_birth';
      }

      if (val && typeof val === 'object' && !Array.isArray(val)) {
        if (val.$or) {
          const orConditions = [];
          val.$or.forEach(orQuery => {
            const orKeys = Object.keys(orQuery);
            orKeys.forEach(ok => {
              let oCol = ok;
              if (table === 'patients' && ok === 'dob') oCol = 'date_of_birth';
              orConditions.push(`${oCol} = ?`);
              params.push(orQuery[ok]);
            });
          });
          if (orConditions.length > 0) {
            conditions.push(`(${orConditions.join(' OR ')})`);
          }
        } else if (val.$regex) {
          conditions.push(`${col} LIKE ?`);
          params.push(`%${val.$regex}%`);
        }
      } else {
        conditions.push(`${col} = ?`);
        params.push(val);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { whereClause, params };
  }

  async find(query = {}) {
    const table = this.getTable(query);
    const { whereClause, params } = this.buildWhere(query);
    const sql = `SELECT * FROM ${table} ${whereClause}`;
    try {
      const rows = await executeQuery(sql, params);
      
      for (let row of rows) {
        row._id = row.id || row.doctor_id || row.patient_id;
        row.role = (table === 'clinicians') ? 'doctor' : 'patient';
        
        if (table === 'patients') {
          row.dob = row.date_of_birth;
        }
        
        if (table === 'reports') {
          const uploadDir = '/Users/sail/Downloads/neurop 2/Backend/uploads/reports/';
          try {
            const filePath = path.join(uploadDir, row.image_path);
            if (fs.existsSync(filePath)) {
              const fileBuffer = fs.readFileSync(filePath);
              row.image_url = `data:image/jpeg;base64,${fileBuffer.toString('base64')}`;
            } else {
              row.image_url = '';
            }
          } catch (e) {
            row.image_url = '';
          }
        }

        if (table === 'rehab') {
          const statuses = await executeQuery(`SELECT date_time, status FROM rehab_status WHERE rehab_id = ?`, [row.id]);
          row.completed_dates = statuses
            .filter(s => s.status === 'Done' || s.status === 'Completed')
            .map(s => new Date(s.date_time).toISOString().substring(0, 10));
          row.status = row.completed_dates.includes(new Date().toISOString().substring(0, 10)) ? 'Completed' : 'pending';
          row.activity_name = row.title;
          row.performance_notes = row.details;
        }

        if (table === 'alerts') {
          row.message = row.alert_text;
        }
      }
      return rows;
    } catch (err) {
      console.error(`Error in MySQL find for ${table}:`, err.message);
      return [];
    }
  }

  async findOne(query = {}) {
    const rows = await this.find(query);
    return rows.length > 0 ? rows[0] : null;
  }

  async findById(id) {
    let table = this.getTable();
    let idCol = 'id';
    if (this.modelName === 'User') {
      if (typeof id === 'string' && id.startsWith('Pid')) {
        table = 'patients';
        idCol = 'patient_id';
      } else {
        table = 'clinicians';
        idCol = 'doctor_id';
      }
    } else if (this.modelName === 'Patient') {
      table = 'patients';
      idCol = 'patient_id';
    } else if (this.modelName === 'Rehab') {
      table = 'rehab';
      idCol = 'id';
    } else if (this.modelName === 'Report') {
      table = 'reports';
      idCol = 'id';
    }
    
    const rows = await this.find({ [idCol]: id });
    return rows.length > 0 ? rows[0] : null;
  }

  async create(data) {
    const table = this.getTable(data);

    if (table === 'reports' && data.image_url) {
      let base64Data = data.image_url;
      if (base64Data.includes('base64,')) {
        base64Data = base64Data.split('base64,')[1];
      }
      const buffer = Buffer.from(base64Data, 'base64');
      const fileName = `report_node_${Date.now()}_${Math.floor(1000 + Math.random()*9000)}.jpg`;
      const uploadDir = '/Users/sail/Downloads/neurop 2/Backend/uploads/reports/';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      fs.writeFileSync(path.join(uploadDir, fileName), buffer);
      data.image_path = fileName;
      delete data.image_url;
    }

    if (table === 'rehab') {
      data.title = data.activity_name || data.title;
      data.details = data.performance_notes || data.details || data.notes || '';
      delete data.activity_name;
      delete data.performance_notes;
    }

    if (table === 'alerts') {
      data.alert_text = data.message || data.alert_text;
      data.alert_date = data.alert_date || new Date().toISOString().substring(0, 10);
      data.status = data.status || 'Active';
      delete data.message;
    }

    const cols = [];
    const placeholders = [];
    const params = [];

    for (let key in data) {
      if (key === 'role') continue;

      let col = key;
      let val = data[key];

      if (table === 'patients') {
        if (key === 'dob') col = 'date_of_birth';
      }

      cols.push(col);
      placeholders.push('?');
      params.push(val);
    }

    if (table === 'patients' && !data.created_at) {
      cols.push('created_at');
      placeholders.push('NOW()');
    }

    const sql = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders.join(', ')})`;
    try {
      if (!pool) return null;
      const [result] = await pool.execute(sql, params);
      
      const newDoc = {
        _id: result.insertId || data.patient_id || data.doctor_id || Math.random().toString(36).substring(2, 9),
        id: result.insertId,
        ...data
      };
      return newDoc;
    } catch (err) {
      console.error(`Error in MySQL create for ${table}:`, err.message);
      throw err;
    }
  }

  async findOneAndUpdate(query, update, options = {}) {
    const table = this.getTable(query);
    const updateData = update.$set || update;

    const updateSets = [];
    const params = [];

    for (let key in updateData) {
      let col = key;
      if (table === 'patients' && key === 'dob') col = 'date_of_birth';
      updateSets.push(`${col} = ?`);
      params.push(updateData[key]);
    }

    const { whereClause, params: whereParams } = this.buildWhere(query);
    params.push(...whereParams);

    const sql = `UPDATE ${table} SET ${updateSets.join(', ')} ${whereClause}`;
    try {
      if (!pool) return null;
      await pool.execute(sql, params);

      if (table === 'rehab' && updateData.status) {
        const row = await this.findOne(query);
        if (row) {
          const rehabId = row.id;
          const patientId = row.patient_id;
          const targetStatus = (updateData.status === 'Completed' || updateData.status === 'Done') ? 'Done' : 'Not Done';
          
          const todayStart = new Date().toISOString().substring(0, 10) + ' 00:00:00';
          const todayEnd = new Date().toISOString().substring(0, 10) + ' 23:59:59';
          await executeQuery(`DELETE FROM rehab_status WHERE rehab_id = ? AND date_time BETWEEN ? AND ?`, [rehabId, todayStart, todayEnd]);
          await executeQuery(`INSERT INTO rehab_status (rehab_id, patient_id, status, date_time) VALUES (?, ?, ?, NOW())`, [rehabId, patientId, targetStatus]);
        }
      }

      return this.findOne(query);
    } catch (err) {
      console.error(`Error in MySQL findOneAndUpdate for ${table}:`, err.message);
      throw err;
    }
  }

  async findByIdAndUpdate(id, update, options = {}) {
    let table = this.getTable();
    let idCol = 'id';
    if (this.modelName === 'User') {
      if (typeof id === 'string' && id.startsWith('Pid')) {
        table = 'patients';
        idCol = 'patient_id';
      } else {
        table = 'clinicians';
        idCol = 'doctor_id';
      }
    } else if (this.modelName === 'Patient') {
      table = 'patients';
      idCol = 'patient_id';
    } else if (this.modelName === 'Rehab') {
      table = 'rehab';
      idCol = 'id';
    } else if (this.modelName === 'Report') {
      table = 'reports';
      idCol = 'id';
    }
    
    const query = { [idCol]: id };
    return this.findOneAndUpdate(query, update, options);
  }

  async deleteOne(query) {
    const table = this.getTable(query);
    const { whereClause, params } = this.buildWhere(query);
    const sql = `DELETE FROM ${table} ${whereClause}`;
    try {
      if (!pool) return { deletedCount: 0 };
      const [result] = await pool.execute(sql, params);
      return { deletedCount: result.affectedRows };
    } catch (err) {
      console.error(`Error in MySQL deleteOne for ${table}:`, err.message);
      return { deletedCount: 0 };
    }
  }

  async findByIdAndDelete(id) {
    let table = this.getTable();
    let idCol = 'id';
    if (this.modelName === 'User') {
      if (typeof id === 'string' && id.startsWith('Pid')) {
        table = 'patients';
        idCol = 'patient_id';
      } else {
        table = 'clinicians';
        idCol = 'doctor_id';
      }
    } else if (this.modelName === 'Patient') {
      table = 'patients';
      idCol = 'patient_id';
    } else if (this.modelName === 'Rehab') {
      table = 'rehab';
      idCol = 'id';
    } else if (this.modelName === 'Report') {
      table = 'reports';
      idCol = 'id';
    }
    
    return this.deleteOne({ [idCol]: id });
  }

  async countDocuments(query = {}) {
    const table = this.getTable(query);
    const { whereClause, params } = this.buildWhere(query);
    const sql = `SELECT COUNT(*) AS count FROM ${table} ${whereClause}`;
    try {
      const rows = await executeQuery(sql, params);
      return rows.length > 0 ? rows[0].count : 0;
    } catch (err) {
      console.error(`Error in MySQL countDocuments for ${table}:`, err.message);
      return 0;
    }
  }
}

class DynamicModel {
  constructor(name, mongooseSchema) {
    this.name = name;
    this.mongooseSchema = mongooseSchema;
    this._mysqlModel = null;
    this._mongoModel = null;
    this._mockModel = null;
  }

  _getModel() {
    if (global.isMySQL) {
      if (!this._mysqlModel) this._mysqlModel = new MySQLModel(this.name);
      return this._mysqlModel;
    } else if (global.isMongo) {
      if (!this._mongoModel) this._mongoModel = mongoose.model(this.name, this.mongooseSchema);
      return this._mongoModel;
    } else {
      if (!this._mockModel) {
        const collectionMap = {
          'User': 'users',
          'Patient': 'patients',
          'PatientScores': 'patientscores',
          'Rehab': 'rehabs',
          'Report': 'reports',
          'Message': 'messages',
          'Notification': 'notifications',
          'Medication': 'medications'
        };
        const collName = collectionMap[this.name] || (this.name.toLowerCase().endsWith('s') ? this.name.toLowerCase() : this.name.toLowerCase() + 's');
        this._mockModel = new MockModel(collName);
      }
      return this._mockModel;
    }
  }

  async find(query) {
    return this._getModel().find(query);
  }

  async findOne(query) {
    return this._getModel().findOne(query);
  }

  async findById(id) {
    return this._getModel().findById(id);
  }

  async create(data) {
    return this._getModel().create(data);
  }

  async findOneAndUpdate(query, update, options) {
    return this._getModel().findOneAndUpdate(query, update, options);
  }

  async findByIdAndUpdate(id, update, options) {
    return this._getModel().findByIdAndUpdate(id, update, options);
  }

  async deleteOne(query) {
    return this._getModel().deleteOne(query);
  }

  async findByIdAndDelete(id) {
    return this._getModel().findByIdAndDelete(id);
  }

  async countDocuments(query) {
    return this._getModel().countDocuments(query);
  }
}

const getModel = (name, mongooseSchema) => {
  return new DynamicModel(name, mongooseSchema);
};

module.exports = {
  connectDB,
  getModel
};
