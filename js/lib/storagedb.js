/*
 BATify: https://www.batify.net/
 https://github.com/mikel2000/batify
 Copyright (C) 2018 Michael Volz (batifyext at gmail dot com)
 Licensed under the Mozilla Public License 2.0
 Please check ../../LICENSE for licensing details
*/

var storageDb =
{
   log_level_debug: 1,
   log_level_error: 2,
   storage: chrome.storage || browser.storage,
   runtime: chrome.runtime || browser.runtime,

   logLevel: null,
   name: null,
   db: null,

   init: function(name, logLevel)
   {
      return new Promise(function(resolve, reject)
      {
         storageDb.name = name;
         storageDb.logLevel = logLevel;

         storageDb.getData(name).then(function(db)
         {
            if(db)
            {
               storageDb.log("init: db already exists -> nothing to do", storageDb.log_level_debug);
               return Promise.resolve(db[storageDb.name]);
            }
            else
            {
               storageDb.log("init: db does not exist -> create it", storageDb.log_level_debug);
               return storageDb.createDb(storageDb.name);
            }
         }).then(function(db)
         {
            storageDb.db = db;
            storageDb.log("init: db initialized: " + JSON.stringify(storageDb.db), storageDb.log_level_debug);
            resolve();
         }).catch(function(e)
         {
            storageDb.log("init: ERROR: db couldn't be initialized: " + e, storageDb.log_level_error);
            reject();
         });
      });
   },

   createDb: function(name)
   {
      return new Promise(function(resolve, reject)
      {
	     var data = {};
	     var db = {tables: {}, data: {}};
	     data[name] = db;

	     storageDb.setData(data).then(function()
	     {
	        resolve(db);
	     }).catch(function(e)
	     {
	        storageDb.log("createDb: ERROR: db couldn't be created: " + e, storageDb.log_level_error);
	        reject();
	     });
      });
   },

   createTables: function(tables)
   {
      return new Promise(function(resolve, reject)
      {
         var created = 0;

         for(var i = 0; i < tables.length; i++)
         {
            if(storageDb.db.tables[tables[i].name])
            {
	           storageDb.log("createTables: table " + tables[i].name + " already exists -> nothing to do", storageDb.log_level_debug);
            }
            else
            {
               storageDb.db.tables[tables[i].name] = {fields: tables[i].fields, autoIncrement: 1};
	           storageDb.db.data[tables[i].name] = {};
               created++;
	           storageDb.log("createTables: table " + tables[i].name + " created", storageDb.log_level_debug);
            }
         }

         if(created > 0)
         {
            storageDb.commit().then(function()
	        {
	           storageDb.log("createTables: " + created + " table(s) successfully created", storageDb.log_level_debug);
               resolve();
	        }).catch(function(e)
	        {
	           storageDb.log("createTables: ERROR: tables couldn't be created: " + name + ", message: " + e, storageDb.log_level_error);
	           reject();
	        });
         }
         else
         {
            resolve();
         }
	  });
   },

   insert: function(tableName, data)
   {
      return new Promise(function(resolve, reject)
      {
         storageDb.log("insert: " + tableName + ", " + JSON.stringify(data), storageDb.log_level_debug);

	     var id = storageDb.db.tables[tableName].autoIncrement;
	     data.id = id;
	     storageDb.db.data[tableName][id] = data;
	     storageDb.db.tables[tableName].autoIncrement++;

	     storageDb.commit().then(function()
	     {
	        storageDb.log("insert: data successfully inserted", storageDb.log_level_debug);
            resolve(data);
	     }).catch(function(e)
	     {
	        storageDb.log("insert: ERROR: data couldn't be inserted: " + e, storageDb.log_level_error);
	        reject();
	     });
      });
   },

   update: function(tableName, data, where)
   {
      return new Promise(function(resolve, reject)
      {
         storageDb.log("update: " + tableName + ", " + JSON.stringify(data) + ", " + JSON.stringify(where), storageDb.log_level_debug);

         var counter = 0;

         for(id in storageDb.db.data[tableName])
         {
            var row = storageDb.db.data[tableName][id];

            if(storageDb.checkMatch(row, where))
            {
               for(column in data)
               {
                  row[column] = data[column];
               }

               storageDb.db.data[tableName][id] = row;
               counter++;
            }
         }

         if(counter > 0)
         {
            storageDb.commit().then(function()
            {
               storageDb.log("update: " + counter + " row(s) successfully updated", storageDb.log_level_debug);
               resolve(counter);
            }).catch(function(e)
            {
               storageDb.log("update: ERROR: update failed: " + e, storageDb.log_level_error);
               reject();
            });
         }
         else
         {
            storageDb.log("update: 0 rows matched criteria -> no rows updated", storageDb.log_level_debug);
            resolve(counter);
         }
      });
   },

   delete: function(tableName, where)
   {
      return new Promise(function(resolve, reject)
      {
         storageDb.log("delete: " + tableName + ", " + JSON.stringify(where), storageDb.log_level_debug);

         var counter = 0;

         for(id in storageDb.db.data[tableName])
         {
            var row = storageDb.db.data[tableName][id];

            if(storageDb.checkMatch(row, where))
            {
               delete storageDb.db.data[tableName][id];
               counter++;
            }
         }

         if(counter > 0)
         {
            storageDb.commit().then(function()
            {
               storageDb.log("delete: " + counter + " row(s) successfully deleted", storageDb.log_level_debug);
               resolve(counter);
            }).catch(function(e)
            {
               storageDb.log("delete: ERROR: delete failed: " + e, storageDb.log_level_error);
               reject(e);
            });
         }
         else
         {
            storageDb.log("delete: 0 rows matched criteria -> no rows deleted", storageDb.log_level_debug);
            resolve(counter);
         }
      });
   },

   select: function(tableName, where)
   {
      return new Promise(function(resolve, reject)
      {
         storageDb.log("select: " + tableName + ", where: " + JSON.stringify(where), storageDb.log_level_debug);
         var out = [];

         for(id in storageDb.db.data[tableName])
         {
            var row = storageDb.db.data[tableName][id];

            if(storageDb.checkMatch(row, where))
            {
               out.push(row);
            }
         }

         storageDb.log("select: " + out.length + " rows found", storageDb.log_level_debug);
         resolve(out);
      });
   },

   checkMatch: function(row, where)
   {
      var matched = true;

      outer:
      for(column in where)
      {
         if(Array.isArray(where[column]))
         {
            var found = false;

            for(var i = 0; i < where[column].length; i++)
            {
               if(row[column] == where[column][i])
               {
                  found = true;
                  break;
               }
            }

            if(found == false)
            {
               matched = false;
               break;
            }
         }
         else if(typeof where[column] === "object")
         {
            for(key in where[column])
            {
               var comp = key;
               var cond = where[column][key];

               if(comp == ">")
               {
                  if(row[column] <= cond)
                  {
                     matched = false;
                     break outer;
                  }
               }
               else if(comp == ">=")
               {
                  if(row[column] < cond)
                  {
                     matched = false;
                     break outer;
                  }
               }
               else if(comp == "<")
               {
                  if(row[column] >= cond)
                  {
                     matched = false;
                     break outer;
                  }
               }
               else if(comp == "<=")
               {
                  if(row[column] > cond)
                  {
                     matched = false;
                     break outer;
                  }
               }
            }
         }
         else if(row[column] != where[column])
         {
            matched = false;
            break;
         }
      }

      return matched;
   },

   commit: function()
   {
      return new Promise(function(resolve, reject)
      {
         var data = {};
         data[storageDb.name] = storageDb.db;

         storageDb.setData(data).then(function()
         {
            storageDb.log("commit: successfully committed", storageDb.log_level_debug);
            resolve();
         }).catch(function(e)
         {
            storageDb.log("commit: ERROR: commit failed: " + e, storageDb.log_level_error);
            reject();
         });
      });
   },

   getData: function(name)
   {
      return new Promise(function(resolve, reject)
      {
         storageDb.storage.local.get(name, function(items)
         {
            if(storageDb.runtime.lastError)
            {
               storageDb.log("getData: ERROR: value couldn't be got: name: " + name + ", msg: " + runtime.lastError, storageDb.log_level_error);
               reject();
            }
            else
            {
               if(Object.keys(items).length === 0 && items.constructor === Object)
               {
                  items = null;
               }

               resolve(items);
            }
         });
      });
   },

   setData: function(data)
   {
      return new Promise(function(resolve, reject)
      {
         storageDb.storage.local.set(data, function()
         {
            if(storageDb.runtime.lastError)
            {
               storageDb.log("setData: ERROR: value couldn't be set: " + JSON.stringify(data) + ", msg: " + runtime.lastError, storageDb.log_level_error);
               reject();
            }
            else
            {
               resolve();
            }
         });
      });
   },

   setLogLevel: function(level)
   {
      storageDb.logLevel = level;
   },

   log: function(message, level)
   {
      if(level >= storageDb.logLevel)
      {
         console.log("BATify: storageDb." + message);
      }
   }
}