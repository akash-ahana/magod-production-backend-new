const reports = require("express").Router();
const { misQuery, setupQuery, misQueryMod, mchQueryMod } = require('../../helpers/dbconn');
const { logger } = require('../../helpers/logger')
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()


reports.post('/muData', jsonParser, async (req, res, next) => {
  // console.log('required date is',req.body);
  try {
    mchQueryMod(`SELECT * FROM magod_production.machine_utilisationsummary where Date='${req.body.Date}'`, (err, data) => {
      if (err) logger.error(err);
      console.log(data.length)
      res.send(data)
    })
  } catch (error) {
    next(error)
  }
});

//Get Machine Utilisation Summary
reports.post('/getMachineUtilisationSummary', jsonParser, async (req, res, next) => {
  // console.log('required date is ', req.body);
  try {
    
    // Check if the machines for the given date already exist in the table
    mchQueryMod(`SELECT COUNT(*) AS count
      FROM magod_production.machine_utilisationsummary
      WHERE Date = '${req.body.Date}'`, async (err, result) => {
      if (err) {
        logger.error(err);
        res.status(500).send({ error: 'An error occurred while checking data existence.' });
      } else {
        const { count } = result[0];
        if (count > 0) {
          // console.log('Data already exists for the date:', req.body.Date);
          // Retrieve all data for the given date
          mchQueryMod(`SELECT * FROM magod_production.machine_utilisationsummary WHERE Date = '${req.body.Date}'`, async (err, data) => {
            if (err) {
              logger.error(err);
              res.status(500).send({ error: 'An error occurred while fetching data.' });
            } else {
              res.send({ data });
            }
          });
          return;
        }

        // Fetch the machines from the first query
        mchQueryMod(`SELECT DISTINCT Machine
          FROM magodmis.shiftlogbook
          WHERE magodmis.shiftlogbook.FromTime >= CONCAT('${req.body.Date}', ' 06:00:00')
            AND magodmis.shiftlogbook.ToTime < CONCAT(DATE_ADD('${req.body.Date}', INTERVAL 1 DAY), ' 06:00:00')`, async (err, machinesData) => {
          if (err) {
            logger.error(err);
            res.status(500).send({ error: 'An error occurred while fetching machines.' });
          } else {
            // console.log('Result of first query:', machinesData); // Console log the result of the first query
            const existingMachines = machinesData.map((machine) => machine.Machine);

            // Insert data for each machine
            const insertQueries = existingMachines.map((machine) => {
              return `INSERT INTO magod_production.machine_utilisationsummary (Machine, TotalOn, ProdON, NonProdOn, TotalOff, Date) 
                  VALUES ('${machine}', '1440', '0', '0', '0', '${req.body.Date}')`;
            });
            const insertPromises = insertQueries.map((insertQuery) => {
              return new Promise((resolve, reject) => {
                mchQueryMod(insertQuery, (err, data) => {
                  if (err) {
                    reject(err);
                  } else {
                    // console.log('Insert result:', data); // Log the result of each insert query
                    resolve(data);
                  }
                });
              });
            });

            // Execute all insert queries
            Promise.all(insertPromises)
              .then((results) => {
                const affectedRows = results.reduce((total, data) => total + (data.affectedRows || 0), 0);
                // Retrieve all data for the given date
                mchQueryMod(`SELECT * FROM magod_production.machine_utilisationsummary WHERE Date = '${req.body.Date}'`, async (err, data) => {
                  if (err) {
                    logger.error(err);
                    res.status(500).send({ error: 'An error occurred while fetching data.' });
                  } else {
                    res.send({ data, affectedRows });
                  }
                });
              })
              .catch((error) => {
                logger.error(error);
                res.status(500).send({ error: 'An error occurred while saving the data.' });
              });
          }
        });
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update Machine Utilization summary
reports.post('/UpdateMachineUtilisationSummary', jsonParser, async (req, res, next) => {
  // console.log('required date is UpdateMachineUtilisationSummary is ',req.body);
  try {
    mchQueryMod(`UPDATE magod_production.machine_utilisationsummary 
    JOIN (
        SELECT
            Machine,
            (TIMESTAMPDIFF(MINUTE, FromTime, ToTime)) AS ProdTime
        FROM
            magodmis.shiftlogbook
        WHERE
            NOT (ISNULL(FromTime) OR ISNULL(ToTime)) AND TaskNo != '100'
        GROUP BY
            Machine
    ) AS productionTime ON magod_production.machine_utilisationsummary.Machine = productionTime.Machine
    SET
    magod_production.machine_utilisationsummary.ProdON = productionTime.ProdTime,
    magod_production.machine_utilisationsummary.NonProdOn = magod_production.machine_utilisationsummary.TotalOn - productionTime.ProdTime,
    magod_production.machine_utilisationsummary.TotalOff='${req.body.TotalOff}',
    magod_production.machine_utilisationsummary.TotalOn=1440-'${req.body.TotalOff}'
    WHERE
    magod_production.machine_utilisationsummary.ID ='${req.body.rowSelected.ID}'`, (err, data) => {
      if (err) logger.error(err);
      // console.log(data.length)
      res.send(data)
    })
  } catch (error) {
    next(error)
  }
});


      
//Production Task Summary
reports.post('/productTaskSummary', jsonParser, async (req, res, next) => {
  // console.log('required date is',req.body);
  try {
    mchQueryMod(`SELECT sum(timestampdiff(minute, s.FromTime, s.toTime)) as machineTime, n.TaskNo, n.ScheduleID,
    s.Machine, n.Cust_Code, n.Mtrl_Code, n.MTRL, n.Thickness, n.Operation, s1.ShiftDate
    FROM magodmis.shiftlogbook s,magodmis.shiftregister s1,magodmis.nc_task_list n 
    WHERE s1.ShiftDate='${req.body.Date}' AND s1.ShiftID=s.ShiftID AND  not s.TaskNo like '100'
     AND n.TaskNo=s.TaskNo GROUP BY s.TaskNo, s.Machine`, (err, data) => {
      if (err) logger.error(err);
      console.log(data.length)
      res.send(data)
    })
  } catch (error) {
    next(error)
  }
});


//////////
reports.post('/machineLog', jsonParser, async (req, res, next) => {
  // console.log('required date is', req.body);

  try {
    const firstQuery = `SELECT magodmis.shiftlogbook.*, magodmis.shiftregister.Shift, magodmis.shiftregister.ShiftID,
      (TIMESTAMPDIFF(MINUTE, magodmis.shiftlogbook.FromTime, magodmis.shiftlogbook.ToTime)) AS MachineTime
  FROM magodmis.shiftlogbook
  JOIN magodmis.shiftregister ON magodmis.shiftlogbook.ShiftID = magodmis.shiftregister.ShiftID
  WHERE magodmis.shiftlogbook.FromTime >= CONCAT('${req.body.Date}', ' 06:00:00')
      AND magodmis.shiftlogbook.ToTime < CONCAT(DATE_ADD('${req.body.Date}', INTERVAL 1 DAY), ' 06:00:00') and TaskNo!='100'
  ORDER BY Shift, Machine`;

    mchQueryMod(firstQuery, async (err, data) => {
      if (err) {
        console.error('Error executing first query:', err);
        return next(err);
      }

      // console.log('First query result:', data.length);

      // Extract unique MProcess values from the first query result
      const MProcessValues = Array.from(new Set(data.map((row) => row.MProcess)));

      if (MProcessValues.length === 0) {
        console.log('No MProcess values found');
        // Handle the case where no MProcess values are present (e.g., handle as 'Administrative')
        const combinedData = {
          firstQueryResult: data,
          secondQueryResult: [{ Operation: 'Administrative' }],
        };
        return res.status(200).json(combinedData);
      }

      // Prepare the second query with the unique MProcess values
      const secondQuery = `SELECT magodmis.shiftlogbook.MProcess, COALESCE(machine_data.operationslist.Operation, 'Administrative') AS Operation
           FROM machine_data.operationslist
           LEFT JOIN magodmis.shiftlogbook ON machine_data.operationslist.ProcessId = magodmis.shiftlogbook.MProcess
            WHERE magodmis.shiftlogbook.MProcess IN (${MProcessValues.map((value) => `'${value}'`).join(', ')})`;

      mchQueryMod(secondQuery, (err, operationsData) => {
        if (err) {
          console.error('Error executing second query:', err);
          return next(err);
        }

        // console.log('Second query result:', operationsData);

        // Combine the results from both queries
        const combinedData = data.map((row) => ({
          ...row,
          Operation: operationsData.find((opData) => opData.MProcess === row.MProcess)?.Operation || 'Administrative',
        }));

        res.status(200).json(combinedData);
        // console.log('Final data:', combinedData);
      });
    });
  } catch (error) {
    console.error('Error in API request:', error);
    next(error);
  }
});



//SaveLog
reports.post('/saveLog', jsonParser, async (req, res, next) => {
  try {
    for (const row of req.body.selectedRows) {
      const program = row.data.Program;
      const FromTime = row.data.FromTime;
      let dateSplit1 = FromTime.split(" ");
      let date1 = dateSplit1[0].split("/")
      let year1 = date1[0];
      let month1 = date1[1];
      let day1 = date1[2];
      let FromTime1 = day1 + "-" + month1 + "-" + year1 + " " + dateSplit1[1] + ":" + "00";

      const ToTime = row.data.ToTime;
      let dateSplit2 = ToTime.split(" ");
      let date2 = dateSplit2[0].split("/")
      let year2 = date2[0];
      let month2 = date2[1];
      let day2 = date2[2];
      let ToTime1 = day2 + "-" + month2 + "-" + year2 + " " + dateSplit2[1] + ":" + "00";
      const query1 = `UPDATE magodmis.ncprograms n
        JOIN (
            SELECT s.Program, SUM(TIMESTAMPDIFF(MINUTE, s.FromTime, s.ToTime)) AS MachineTime
            FROM magodmis.shiftlogbook s
            JOIN magodmis.ncprograms n ON s.Program = n.NCProgramNo
            WHERE s.Program ='${program}'
            GROUP BY s.Program
        ) AS A ON A.Program = n.NCProgramNo
        SET n.ActualTime = A.MachineTime;`;

      const shiftID = row.data.ShiftID;
      const Srl = row.data.Srl;
      const query2 = `UPDATE magodmis.shiftlogbook
        SET FromTime = '${FromTime1}', ToTime = '${ToTime1}'
        WHERE ShiftID = '${shiftID}' AND  Srl='${Srl}'`;

      await new Promise((resolve, reject) => {
        mchQueryMod(query1, (err, data) => {
          if (err) {
            logger.error(err);
            reject(err);
          } else {
            resolve(data);
          }
        });
      });

      await new Promise((resolve, reject) => {
        mchQueryMod(query2, (err, data) => {
          if (err) {
            logger.error(err);
            reject(err);
          } else {
            resolve(data);
          }
        });
      });
    }

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
});


//UPDATE MACHINE UTILISATION SUMMARY
reports.post('/UpdateMachineUtilisation', jsonParser, async (req, res, next) => {
  try {
    const productionTime = await getProductionTime(); // Assuming you have a function to retrieve the productionTime data

    for (const dr of Production1.machine_utilisationsummary.Rows) {
      dr.ProdON = 0;
      dr.TotalOn = 1440;
    }

    for (const MachTime of productionTime) {
      const machineSummary = Production1.machine_utilisationsummary.Rows.find(row => row.Machine === MachTime.Machine);
      if (machineSummary) {
        machineSummary.ProdON = MachTime.ProdTime;
        machineSummary.NonProdOn = machineSummary.TotalOn - machineSummary.ProdON;
      }
    }

    res.send(Production1.machine_utilisationsummary.Rows); // Sending updated machine utilization summary data
  } catch (error) {
    next(error);
  }
});


//TreeView
reports.post('/reportsTreeView', jsonParser , async (req, res, next) => { 
  // console.log('REPORTS Tree View', req.body.Date)
  let outputArray = []
  try {
      mchQueryMod(`Select ml.refName, sl.ShiftID,sl.Machine,sl.MProcess,sl.FromTime, sl.ToTime, sl.TaskNo,  sr.Shift, TIMESTAMPDIFF(MINUTE, sl.FromTime, sl.ToTime) as timediff, sl.StoppageID, 
      IF(sl.MProcess = '' , (SELECT sc.GroupName FROM magod_production.stoppagereasonlist as srl join magod_production.stoppage_category as sc on srl.StoppageGpId=sc.StoppageGpId 
      where sl.StoppageID=srl.StoppageID ), IF(sl.MProcess = 'Stoppage' && sl.TaskNo='100' , (SELECT sc.GroupName FROM magod_production.stoppagereasonlist as srl join magod_production.stoppage_category as sc on srl.StoppageGpId=sc.StoppageGpId 
      where sl.StoppageID=srl.StoppageID ), IF(sl.MProcess = 'Stoppage', (SELECT nc.Operation FROM magodmis.nc_task_list as nc where sl.TaskNo=nc.TaskNo), (select ol.Operation from machine_data.operationslist as ol where ol.ProcessId=sl.MProcess)))) as operation
      from  machine_data.machine_list as ml left join magodmis.shiftlogbook as sl on sl.Machine= ml.refName and DATE(sl.FromTime) like '${req.body.Date}' left  join magodmis.shiftregister as sr on sl.ShiftID=sr.ShiftID`, (err, data) => {
          if (err) logger.error(err);
          // console.log(data.length, data, req.body.Date)

          const MachineProcessData = [];
          // Iterate over each object in data
          data.forEach((item) => {
              
            // Find the machine object in MachineProcessData
            let machineObj = MachineProcessData.find((machine) => machine.MachineName === item.Machine);

            // If machine object doesn't exist, create a new one
            if (!machineObj) {
              machineObj = {
                MachineName: item.ShiftID==null? item.refName: item.Machine,
                Shifts: []
              };
              // console.log(item,machineObj)
              MachineProcessData.push(machineObj);
            }

            // Find the shift object in machineObj.Shifts
            let shiftObj = machineObj.Shifts.find((shift) => shift.Shift === item.Shift);

            // If shift object doesn't exist, create a new one
            if (item.ShiftID!=null){
            if (!shiftObj) {
              shiftObj = {
                Shift: item.Shift==null? "": item.Shift,
                task: [],
                time : item.timediff == null?'':item.timediff.toString()
              };
              machineObj.Shifts.push(shiftObj);
            }
            else{
              shiftObj.time = (parseInt(shiftObj.time) + parseInt(item.timediff)).toString();
            }

            // Find the task object in shiftObj.task
            let taskObj = shiftObj.task.find((task) => task.action === ((!item.MProcess ||(item.MProcess=='Stoppage' && item.TaskNo=='100')) ? "Non Productive" : "Production"));

            // If task object doesn't exist, create a new one
            if (!taskObj) {
              taskObj = {
                action: (!item.MProcess ||(item.MProcess=='Stoppage' && item.TaskNo=='100')) ? "Non Productive" : "Production",
                operations: [],
                time: item.timediff == null? '': item.timediff.toString(),
              };
              
              shiftObj.task.push(taskObj);
            }
            else {
              taskObj.time = (parseInt(taskObj.time) + parseInt(item.timediff)).toString();
            }
            // Find the operation object in taskObj.operations
            let operationObj = taskObj.operations.find((operation) => operation.Operation === (item.operation || "Break"));

            // If operation object doesn't exist, create a new one
            if (!operationObj) {
              operationObj = {
                Operation: item.operation || "Break",
                time: item.timediff == null? '': item.timediff.toString(),
              };
              taskObj.operations.push(operationObj);
            } else {
              operationObj.time = (parseInt(operationObj.time) + parseInt(item.timediff)).toString();
            }
          }
          });

          // console.log(MachineProcessData);
          res.send(MachineProcessData)
      })
  } catch (error) {
      next(error)
  }
});

//MachineOnclcick
reports.post('/machineOnclick', jsonParser, async (req, res, next) => {
  // console.log('required date is', req.body);
  try {
    const firstQuery = `SELECT magodmis.shiftlogbook.*, magodmis.shiftregister.Shift, magodmis.shiftregister.ShiftID,
    (TIMESTAMPDIFF(MINUTE, magodmis.shiftlogbook.FromTime, magodmis.shiftlogbook.ToTime)) AS MachineTime
  FROM magodmis.shiftlogbook
  JOIN magodmis.shiftregister ON magodmis.shiftlogbook.ShiftID = magodmis.shiftregister.ShiftID
  WHERE magodmis.shiftlogbook.FromTime >= CONCAT('${req.body.Date}', ' 06:00:00')
      AND magodmis.shiftlogbook.ToTime < CONCAT(DATE_ADD('${req.body.Date}', INTERVAL 1 DAY), ' 06:00:00')
      AND magodmis.shiftlogbook.TaskNo != '100'
      AND magodmis.shiftlogbook.Machine='${req.body.Machine}'`;

    mchQueryMod(firstQuery, async (err, data) => {
      if (err) {
        console.error('Error executing first query:', err);
        return next(err);
      }

      // console.log('First query result:', data.length);

      // Extract unique MProcess values from the first query result
      const MProcessValues = Array.from(new Set(data.map((row) => row.MProcess)));

      if (MProcessValues.length === 0) {
        console.log('No MProcess values found');
        // Handle the case where no MProcess values are present (e.g., handle as 'Administrative')
        const combinedData = {
          firstQueryResult: data,
          secondQueryResult: [{ Operation: 'Administrative' }],
        };
        return res.status(200).json(combinedData);
      }

      // Prepare the second query with the unique MProcess values
      const secondQuery = `SELECT magodmis.shiftlogbook.MProcess, COALESCE(machine_data.operationslist.Operation, 'Administrative') AS Operation
           FROM machine_data.operationslist
           LEFT JOIN magodmis.shiftlogbook ON machine_data.operationslist.ProcessId = magodmis.shiftlogbook.MProcess
            WHERE magodmis.shiftlogbook.MProcess IN (${MProcessValues.map((value) => `'${value}'`).join(', ')})`;

      mchQueryMod(secondQuery, (err, operationsData) => {
        if (err) {
          console.error('Error executing second query:', err);
          return next(err);
        }

        // console.log('Second query result:', operationsData);

        // Combine the results from both queries
        const combinedData = data.map((row) => ({
          ...row,
          Operation: operationsData.find((opData) => opData.MProcess === row.MProcess)?.Operation || 'Administrative',
        }));

        res.status(200).json(combinedData);
        // console.log('Final data:', combinedData);
      });
    });
  } catch (error) {
    console.error('Error in API request:', error);
    next(error);
  }
});


//Shift OnClick
reports.post('/shiftOnClick', jsonParser, async (req, res, next) => {
  // console.log('required date is', req.body);
  try {
    const firstQuery = `SELECT magodmis.shiftlogbook.*, magodmis.shiftregister.Shift, magodmis.shiftregister.ShiftID,
    (TIMESTAMPDIFF(MINUTE, magodmis.shiftlogbook.FromTime, magodmis.shiftlogbook.ToTime)) AS MachineTime
  FROM magodmis.shiftlogbook
  JOIN magodmis.shiftregister ON magodmis.shiftlogbook.ShiftID = magodmis.shiftregister.ShiftID
  WHERE magodmis.shiftlogbook.FromTime >= CONCAT('${req.body.Date}', ' 06:00:00')
      AND magodmis.shiftlogbook.ToTime < CONCAT(DATE_ADD('${req.body.Date}', INTERVAL 1 DAY), ' 06:00:00')
      AND magodmis.shiftlogbook.TaskNo != '100'
      AND magodmis.shiftlogbook.Machine='${req.body.Machine}'and  magodmis.shiftregister.Shift='${req.body.Shift}' `;

    mchQueryMod(firstQuery, async (err, data) => {
      if (err) {
        console.error('Error executing first query:', err);
        return next(err);
      }

      // console.log('First query result:', data.length);

      // Extract unique MProcess values from the first query result
      const MProcessValues = Array.from(new Set(data.map((row) => row.MProcess)));

      if (MProcessValues.length === 0) {
        console.log('No MProcess values found');
        // Handle the case where no MProcess values are present (e.g., handle as 'Administrative')
        const combinedData = {
          firstQueryResult: data,
          secondQueryResult: [{ Operation: 'Administrative' }],
        };
        return res.status(200).json(combinedData);
      }

      // Prepare the second query with the unique MProcess values
      const secondQuery = `SELECT magodmis.shiftlogbook.MProcess, COALESCE(machine_data.operationslist.Operation, 'Administrative') AS Operation
           FROM machine_data.operationslist
           LEFT JOIN magodmis.shiftlogbook ON machine_data.operationslist.ProcessId = magodmis.shiftlogbook.MProcess
            WHERE magodmis.shiftlogbook.MProcess IN (${MProcessValues.map((value) => `'${value}'`).join(', ')})`;

      mchQueryMod(secondQuery, (err, operationsData) => {
        if (err) {
          console.error('Error executing second query:', err);
          return next(err);
        }

        // console.log('Second query result:', operationsData);

        // Combine the results from both queries
        const combinedData = data.map((row) => ({
          ...row,
          Operation: operationsData.find((opData) => opData.MProcess === row.MProcess)?.Operation || 'Administrative',
        }));

        res.status(200).json(combinedData);
        // console.log('Final data:', combinedData);
      });
    });
  } catch (error) {
    console.error('Error in API request:', error);
    next(error);
  }
});


//Prepare report 
reports.post('/prepare-report', jsonParser, async (req, res, next) => {
  // console.log('required date is', req.body);

  try {
    mchQueryMod(`INSERT INTO magodmis.dailyreport_status (Date,report_status) 
    VALUES ('${req.body.Date}',1)`, (err, data) => {
      if (err) logger.error(err);
      console.log(data.length)
      res.send(data)
    })
  } catch (error) {
    next(error)
  }
});


//GET STATUS
reports.post('/getStatusPrintReport', jsonParser, async (req, res, next) => {
  // console.log('required date is', req.body.Date);

  try {
    mchQueryMod(`SELECT COUNT(*) AS rowCount FROM magodmis.dailyreport_status WHERE Date = '${req.body.Date}'`, (err, data) => {
      if (err) logger.error(err);
      // console.log(data)
      const rowCount = data[0].rowCount;
      // console.log("required row count here",rowCount,"for date",req.body.Date); // Output: 0
      if(rowCount==0){
        res.send(false)
      }
      else{
        res.send(true)
      }

    })
  } catch (error) {
    next(error)
  }
});


//PRINT PDF
reports.post('/printDailyReport', jsonParser, async (req, res, next) => {
  console.log("/printDailyReport", req.body);
  try {
    const firstQuery = `SELECT
    ml.refName AS MachineName,
    mus.LaserOn,
    TIME_FORMAT(SEC_TO_TIME(mus.ProdON * 60), '%H:%i') AS ProdON,
    TIME_FORMAT(SEC_TO_TIME(mus.NonProdOn * 60), '%H:%i') AS NonProdOn,
    TIME_FORMAT(SEC_TO_TIME(mus.TotalOff * 60), '%H:%i') AS TotalOff,
    sl.TaskNo,
    sl.FromTime,
    sl.ToTime,
    TIMESTAMPDIFF(MINUTE, sl.FromTime, sl.ToTime) AS time,
    sl.MProcess
  FROM
    machine_data.machine_list AS ml
    JOIN magodmis.shiftlogbook AS sl ON sl.Machine = ml.refName
    LEFT JOIN magod_production.machine_utilisationsummary AS mus ON sl.FromTime LIKE CONCAT(DATE(mus.Date), '%')
  WHERE
    DATE(sl.FromTime) = '${req.body.Date}'
  `;

    mchQueryMod(firstQuery, async (err, data) => {
      if (err) {
        console.error('Error executing first query:', err);
        return next(err);
      }

      // console.log('First query result:', data.length);

      // Extract unique MProcess values from the first query result
      const MProcessValues = Array.from(new Set(data.map((row) => row.MProcess)));

      if (MProcessValues.length === 0) {
        console.log('No MProcess values found');
        // Handle the case where no MProcess values are present (e.g., handle as 'Administrative')
        const combinedData = {
          firstQueryResult: data,
          secondQueryResult: [{ Operation: 'Administrative' }],
        };
        return res.status(200).json(combinedData);
      }

      // Prepare the second query with the unique MProcess values
      const secondQuery = `SELECT magodmis.shiftlogbook.MProcess, COALESCE(machine_data.operationslist.Operation, 'Administrative') AS Operation
        FROM machine_data.operationslist
        LEFT JOIN magodmis.shiftlogbook ON machine_data.operationslist.ProcessId = magodmis.shiftlogbook.MProcess
        WHERE magodmis.shiftlogbook.MProcess IN (${MProcessValues.map((value) => `'${value}'`).join(', ')})`;

      mchQueryMod(secondQuery, (err, operationsData) => {
        if (err) {
          console.error('Error executing second query:', err);
          return next(err);
        }

        // console.log('Second query result:', operationsData);

        // Combine the results from both queries
        const combinedData = data.map((row) => ({
          ...row,
          Operation: operationsData.find((opData) => opData.MProcess === row.MProcess)?.Operation || 'Administrative',
        }));

        const MachineProcessData = [];

        // Iterate over each object in combinedData
        combinedData.forEach((item) => {
          // Find the machine object in MachineProcessData
          let machineObj = MachineProcessData.find((machine) => machine.MachineName === item.MachineName);

          // If machine object doesn't exist, create a new one
          if (!machineObj) {
            machineObj = {
              MachineName: item.MachineName,
              LaserOn: item.LaserOn || '', // Replace with the actual value of LaserOn
              ProdON: item.ProdON || '', // Replace with the actual value of ProdON
              NonProdOn: item.NonProdOn || '', // Replace with the actual value of NonProd
              TotalOff: item.TotalOff || '', // Replace with the actual value of TotalOff
              tasks: [],
            };
            MachineProcessData.push(machineObj);
          }

          // Determine the task type based on TaskNo
          let action = '';
          if (!item.MProcess || (item.MProcess == 'Stoppage' && item.TaskNo == '100')) {
            action = 'Non Production';
          } else {
            action = 'Production';
          }

          // Find the task object in machineObj.tasks
          let taskObj = machineObj.tasks.find((task) => task.task === action);

          // If task object doesn't exist, create a new one
          if (!taskObj) {
            taskObj = {
              task: action,
              operations: [],
            };
            machineObj.tasks.push(taskObj);
          }

          // Find the operation object in taskObj.operations
          let operationObj = taskObj.operations.find((operation) => operation.Operation === (item.Operation || "Break"));
// If operation object doesn't exist, create a new one
if (!operationObj) {
  const timeValue = !isNaN(parseInt(item.time)) ? item.time : '0';
  console.log(timeValue)
  operationObj = {
    Operation: item.Operation || 'Break',
    time: timeValue.toString(),
  };
  taskObj.operations.push(operationObj);
}


          // Add the operation time to the task's time
          taskObj.time = (parseInt(taskObj.time) + parseInt(item.time)).toString();
        });

        // Sort the tasks based on MachineName
        MachineProcessData.forEach((machine) => {
          machine.tasks.sort((a, b) => a.task.localeCompare(b.task));
        });

        res.send(MachineProcessData);
      });
    });
  } catch (error) {
    next(error);
  }
});



module.exports = reports;