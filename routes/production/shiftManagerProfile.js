const shiftManagerProfile = require("express").Router();
const { misQuery, setupQuery, misQueryMod, mchQueryMod , productionQueryMod } = require('../../helpers/dbconn');
const { logger } = require('../../helpers/logger')
var bodyParser = require('body-parser')
const moment = require('moment')

var jsonParser = bodyParser.json()

function delay(time) { 
    return new Promise(resolve => setTimeout(resolve, time));
  }

  shiftManagerProfile.post('/getShiftInformation', jsonParser ,  async (req, res, next) => {
    console.log('/getShiftInformation' , req.body)
     try {
         misQueryMod(`Select * from magodmis.day_shiftregister where ShiftDate = '${req.body.ShiftDate}' && Shift = '${req.body.Shift}'`, (err, data) => {
             if (err) logger.error(err);
             console.log(data)
             res.send(data) 
         })
     } catch (error) { 
         next(error)
     }
    
 });

shiftManagerProfile.get('/profileListMachines', async (req, res, next) => {
    let outputArray = []
    try {
        misQueryMod(`SELECT distinct m.refName , m.Machine_srl FROM machine_data.machine_list m,
        machine_data.machine_process_list m1,machine_data.operationslist o,
         machine_data.profile_cuttingoperationslist p 
         WHERE m1.Machine_srl=m.Machine_srl AND o.Operation=m1.RefProcess 
         AND m.Working AND p.OperationId=o.OperationID`, async (err, data) => { 
            if (err) logger.error(err);
            console.log('data length is ' , data.length)
           for (let i =0 ; i<data.length ; i++) {
                let customObject = {MachineName : "" , process : []}
                customObject.MachineName = data[i].refName

                //getting processForMachine
                try {
                    mchQueryMod(`select RefProcess from machine_process_list where Machine_srl='${data[i].Machine_srl}'`, (err, datanew) => {
                        if (err) logger.error(err);
                        console.log('PROCESS FOR MACHINE' , data[i].refName, + " " + datanew.length)
                        for(let k =0 ; k<datanew.length ; k++) {
                            customObject.process.push(datanew[k])
                        }
                        
                       // res.send(data)
                    })
                } catch (error) { 
                    next(error)
                }

               // console.log('CUSTOM OBJECT IS ' , customObject)


                outputArray.push(customObject)

           }
           // const slicedArray = data.slice(0, 200);
           // res.send(data)
           await delay(1000)
            res.send(outputArray)
        })
    } catch (error) {
        next(error)
    }
});



shiftManagerProfile.get('/profileListMachinesTaskNo', async (req, res, next) => {
    console.log('OnClick of Machines')
    let outputArray = []
    try {
        misQueryMod(`SELECT distinct m.refName , m.Machine_srl FROM machine_data.machine_list m,
        machine_data.machine_process_list m1,machine_data.operationslist o,
         machine_data.profile_cuttingoperationslist p 
         WHERE m1.Machine_srl=m.Machine_srl AND o.Operation=m1.RefProcess 
         AND m.Working AND p.OperationId=o.OperationID`, async (err, data) => {
            if (err) logger.error(err);
            console.log('data length is ' , data.length)
           for (let i =0 ; i<data.length ; i++) {
                let customObject = {MachineName : "" , process : []}
                customObject.MachineName = data[i].refName

                //getting processForMachine
                try {
                    mchQueryMod(`SELECT TaskNo, Mtrl_Code , NCProgramNo , PStatus FROM magodmis.ncprograms where Machine = '${data[i].refName}'  && (PStatus = 'Cutting' || PStatus = 'Completed')`, (err, datanew) => {
                        if (err) logger.error(err);
                        //console.log('PROCESS FOR MACHINE' , data[i].refName, + " " + datanew.length)
                        for(let k =0 ; k<datanew.length ; k++) {
                            customObject.process.push(datanew[k]) 
                        }
                        
                       // res.send(data)
                    })
                } catch (error) { 
                    next(error)
                }

               // console.log('CUSTOM OBJECT IS ' , customObject)


                outputArray.push(customObject)

           }
           // const slicedArray = data.slice(0, 200);
           // res.send(data)
           await delay(1000)

            res.send(outputArray)
        })
    } catch (error) {
        next(error)
    }
});

shiftManagerProfile.get('/profileMachines', async (req, res, next) => {
    let outputArray = []
    try {
        misQueryMod(`SELECT distinct m.refName , m.Machine_srl FROM machine_data.machine_list m,
        machine_data.machine_process_list m1,machine_data.operationslist o,
         machine_data.profile_cuttingoperationslist p 
         WHERE m1.Machine_srl=m.Machine_srl AND o.Operation=m1.RefProcess 
         AND m.Working AND p.OperationId=o.OperationID`, async (err, data) => {
            if (err) logger.error(err);
            //console.log('data length is ' , data.length)
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

shiftManagerProfile.post('/shiftManagerProfileFilteredMachines', jsonParser ,  async (req, res, next) => {
    console.log('/machineAllotmentScheduleTableFormMachines')

    console.log(req.body.Operation)
         try {
        misQueryMod(`SELECT distinct m.refName , m.Machine_srl FROM machine_data.machine_list m,
        machine_data.machine_process_list m1,machine_data.operationslist o,
         machine_data.profile_cuttingoperationslist p 
         WHERE m1.Machine_srl=m.Machine_srl AND o.Operation=m1.RefProcess 
         AND m.Working AND p.OperationId=o.OperationID AND m1.Mprocess='${req.body.Operation}'`, (err, data) => {
            if (err) logger.error(err);
            console.log(data)
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
    
    //res.send('Request Recieved')  
});

shiftManagerProfile.post('/taskNoProgramNoCompleted', jsonParser ,  async (req, res, next) => {
    //console.log('/taskNoProgramNoCompleted' , req.body)
     try {
         mchQueryMod(`SELECT * FROM magodmis.ncprograms where NCProgramNo = '${req.body.NCProgramNo}' && PStatus = 'Completed'`, (err, data) => {
             if (err) logger.error(err);
             //console.log(data)
             res.send(data)
         })
     } catch (error) { 
         next(error)
     }
 });

 shiftManagerProfile.post('/taskNoProgramNoProcessing', jsonParser ,  async (req, res, next) => {
    console.log('/taskNoProgramNoProcessing' , req.body)
     try {
         mchQueryMod(`SELECT * FROM magodmis.ncprograms where NCProgramNo = '${req.body.NCProgramNo}' && PStatus = 'Cutting'`, (err, data) => {
             if (err) logger.error(err);
             //console.log(data)
             res.send(data)
         })
     } catch (error) { 
         next(error)
     }
 });

shiftManagerProfile.post('/profileListMachinesProgramesCompleted', jsonParser ,  async (req, res, next) => {
   //console.log('/profileListMachinesProgramesCompleted' , req.body)
    try {
        mchQueryMod(`SELECT * FROM magodmis.ncprograms where Machine = '${req.body.MachineName}' && PStatus = 'Completed'`, (err, data) => {
            if (err) logger.error(err);
            //console.log(data)
            res.send(data)
        })
    } catch (error) { 
        next(error)
    }
});

shiftManagerProfile.post('/profileListMachinesProgramesProcessing', jsonParser ,  async (req, res, next) => {
    //console.log('/profileListMachinesProgramesProcessing' , req.body)
     try {
         misQueryMod(`SELECT * FROM magodmis.ncprograms where Machine = '${req.body.MachineName}' && PStatus = 'Cutting'`, (err, data) => {
             if (err) logger.error(err);
             //console.log(data)
             res.send(data)
         })
     } catch (error) {
         next(error)
     }
 });

 shiftManagerProfile.post('/OperationMachinesProgramesCompleted', jsonParser ,  async (req, res, next) => {
    //console.log('/profileListMachinesProgramesCompleted' , req.body)
     try {
         mchQueryMod(`SELECT * FROM magodmis.ncprograms where Machine = '${req.body.MachineName}' && Operation = '${req.body.Operation}' && PStatus = 'Completed'`, (err, data) => {
             if (err) logger.error(err);
             //console.log(data)
             res.send(data)
         })
     } catch (error) { 
         next(error)
     }
 });

 shiftManagerProfile.post('/OperationMachinesProgramesProcessing', jsonParser ,  async (req, res, next) => {
    //console.log('/profileListMachinesProgramesProcessing' , req.body)
     try {
         misQueryMod(`SELECT * FROM magodmis.ncprograms where Machine = '${req.body.MachineName}' && Operation = '${req.body.Operation}' &&  PStatus = 'Cutting'`, (err, data) => {
             if (err) logger.error(err);
             //console.log(data)
             res.send(data)
         })
     } catch (error) {
         next(error)
     }
 });

 shiftManagerProfile.post('/OperationProgramesCompleted', jsonParser ,  async (req, res, next) => {
    //console.log('/profileListMachinesProgramesCompleted' , req.body)
     try {
         mchQueryMod(`SELECT * FROM magodmis.ncprograms where Operation = '${req.body.Operation}' && PStatus = 'Completed'`, (err, data) => {
             if (err) logger.error(err);
             //console.log(data)
             res.send(data)
         })
     } catch (error) { 
         next(error)
     }
 });

 shiftManagerProfile.post('/CustomerProgramesCompleted', jsonParser ,  async (req, res, next) => {
    //console.log('/profileListMachinesProgramesCompleted' , req.body)
     try {
         mchQueryMod(`SELECT * FROM magodmis.ncprograms where Cust_Code = '${req.body.Cust_Code}' && PStatus = 'Completed' `, (err, data) => {
             if (err) logger.error(err);
             //console.log(data)
             res.send(data)
         })
     } catch (error) { 
         next(error)
     }
 });

 shiftManagerProfile.post('/CustomerProgramesProcessing', jsonParser ,  async (req, res, next) => {
    //console.log('/profileListMachinesProgramesProcessing' , req.body)
     try {
         misQueryMod(`SELECT * FROM magodmis.ncprograms where Cust_Code = '${req.body.Cust_Code}'  &&  PStatus = 'Cutting'`, (err, data) => {
             if (err) logger.error(err);
             //console.log(data)
             res.send(data)
         })
     } catch (error) {
         next(error)
     }
 });

 shiftManagerProfile.post('/OperationProgramesProcessing', jsonParser ,  async (req, res, next) => {
    //console.log('/profileListMachinesProgramesProcessing' , req.body)
     try {
         misQueryMod(`SELECT * FROM magodmis.ncprograms where  Operation = '${req.body.Operation}' &&  PStatus = 'Cutting'`, (err, data) => {
             if (err) logger.error(err);
             //console.log(data)
             res.send(data)
         })
     } catch (error) {
         next(error)
     }
 });

 shiftManagerProfile.get('/orderByOperations', jsonParser ,  async (req, res, next) => {
     let outputArray = []
    //console.log('/profileListMachinesProgramesProcessing' , req.body)
     try {
         mchQueryMod(`SELECT ol.Operation, ol.ProcessId FROM machine_data.profile_cuttingoperationslist pcol
         inner join machine_data.operationslist ol on pcol.OperationId = ol.OperationID`, async (err, data) => {
             if (err) logger.error(err);

             for (let i =0 ; i<data.length ; i++) {
                let customObject = {Operation : "" , Machines : []}
                customObject.Operation = data[i].Operation
                try { 
                    mchQueryMod(`select mpl.Machine_srl, ml.refName from machine_data.machine_process_list mpl 
                    join machine_data.machine_list ml on ml.Machine_srl = mpl.Machine_srl 
                    where mpl.RefProcess = '${data[i].Operation}' && ml.Working = '1'`, async (err, datanew) => {
                        if (err) logger.error(err);
                        for(let k =0 ; k<datanew.length ; k++) {
                            console.log('Machine ' , datanew[k] ," Operation " ,  data[i].Operation)
                            const processObject = [];
                            try {
                                misQueryMod(`select NCProgramNo, TaskNo , PStatus from magodmis.ncprograms where Machine='${datanew[k].refName}' && Operation='${data[i].Operation}' && (PStatus='Completed' || PStatus='Cutting')`, (err, datanew1) => {
                                    if (err) logger.error(err);
                                    //customObject.programs.push(datanew1)
                                    //processObject = datanew1
                                    datanew[k].process = datanew1
                                    //console.log(datanew1)
                                })
                            } catch (error) {
                                next(error)
                            }
                            
                            //datanew[k].process = processObject
                            customObject.Machines.push(datanew[k]) 
                            
                            
                        }
                        await delay(2000)
                    })
                } catch (error) {
                    next(error)
                }
                outputArray.push(customObject)
           }
           await delay(15000)
            res.send(outputArray)
         })
     } catch (error) {
         next(error)
     }
 });

 shiftManagerProfile.post('/shiftManagerncProgramTaskList', jsonParser ,  async (req, res, next) => {
    console.log('/shiftManagerncProgramTaskList' , req.body)
     try {
         misQueryMod(`SELECT * FROM magodmis.ncprogram_partslist where TaskNo = '${req.body.TaskNo}'`, (err, data) => {
             if (err) logger.error(err);
             
             res.send(data)
         })
     } catch (error) {  
         next(error)
     }
 });

 shiftManagerProfile.post('/shiftManagerCloseProgram', jsonParser ,  async (req, res, next) => {
    console.log('/shiftManagerCloseProgram' , req.body)
    console.log('/shiftManagerCloseProgram' , req.body.length)

    for(let i = 0 ; i<req.body.length ; i++) {

         try {
         misQueryMod(`UPDATE magodmis.ncprogram_partslist
         SET QtyCleared = '${req.body[i].QtyCleared}', QtyRejected = '${req.body[i].QtyRejected}', Remarks = '${req.body[i].Remarks}'
         WHERE NcProgramNo = '${req.body[i].NcProgramNo}' && TaskNo = '${req.body[i].TaskNo}' && DwgName= '${req.body[i].DwgName}'`, (err, data) => {
             if (err) logger.error(err);
             
             //res.send(data)
         })
     } catch (error) {    
         next(error) 
     }

    }
    
    res.send('All Records Saved to the DB')
 });

 shiftManagerProfile.post('/CloseProgram', jsonParser ,  async (req, res, next) => {
    //console.log('/shiftManagerCloseProgram' , req.body)
    //console.log('/shiftManagerCloseProgram' , req.body.length)
    console.log('Close Program request is ' , req.body)

         try {
         misQueryMod(`UPDATE magodmis.ncprograms SET PStatus = 'Closed'  WHERE NcProgramNo = '${req.body.NCProgramNo}'`, (err, data) => {
             if (err) logger.error(err);
             
             res.send(data)
         })
     } catch (error) {     
         next(error) 
     }
 });

 shiftManagerProfile.post('/changeMachine', jsonParser ,  async (req, res, next) => {
    console.log('/changeMachine' , req.body)
     try {
         misQueryMod(`UPDATE magodmis.ncprograms SET Machine = '${req.body.NewMachine}' WHERE NCProgramNo = '${req.body.NCProgramNo}';`, (err, data) => {
             if (err) logger.error(err);
             console.log(data)
             res.send(data)
         })
     } catch (error) { 
         next(error)
     }
 });

 shiftManagerProfile.get('/productionTaskListTabData', jsonParser ,  async (req, res, next) => {
    console.log('/productionTaskListTabData' , req.body)
    let customArray = [];
     try {
         misQueryMod(`SELECT distinct m.refName , m.Machine_srl FROM machine_data.machine_list m,
         machine_data.machine_process_list m1,machine_data.operationslist o,
          machine_data.profile_cuttingoperationslist p 
          WHERE m1.Machine_srl=m.Machine_srl AND o.Operation=m1.RefProcess 
          AND m.Working AND p.OperationId=o.OperationID`, (err, data) => {
             if (err) logger.error(err);
             console.log(data)
             let newArray = [];
             
             for( let i =0 ; i<data.length ; i++) {
                console.log(data[i].refName)
                try {
                    misQueryMod(`SELECT * FROM magodmis.ncprograms where Machine = '${data[i].refName}'`, (err, datanew) => {
                        if (err) logger.error(err);
                        for( let k = 0 ; k< datanew.length ; k++) {
                            customArray.push(datanew[i])
                        }
                        
                    })
                } catch (error) { 
                    next(error)
                }
             }
             delay(3000) 
             //
         })
     } catch (error) { 
         next(error)
     }
     res.send(customArray)
 });

 shiftManagerProfile.get('/orderByCustomers', jsonParser ,  async (req, res, next) => {
    console.log('/orderByCustomers')
    let outputArray = []

    try {
        misQueryMod(`SELECT Cust_name, Cust_Code FROM magodmis.cust_data where LastBilling > '2021-06-11 00:00:00'`, async (err, data) => {
            if (err) logger.error(err);

            for(let i =0;i<data.length;i++){
                try {
                    let customObject = {Customer : ""}
                    misQueryMod(`select NCProgramNo, TaskNo , Machine , PStatus from magodmis.ncprograms where Cust_Code = '${data[i].Cust_Code}' && (PStatus='Completed' || PStatus='Cutting')`, async (err, datanc) => {
                        if (err) logger.error(err);
                        console.log(datanc, data[i]) 
                        data[i].programs = datanc
                        customObject.Customer = data[i]
                        //customObject.programs.push(datanc)
                        outputArray.push(customObject)  
                        //res.send(data)  
                        await delay(20000) 
                    })
                } catch (error) {  
                    next(error) 
                }
            }
            //res.send(data)
            await delay(30000) 
            res.send(outputArray)
        })
    } catch (error) {  
        next(error) 
    }
   
});


//////////////////
shiftManagerProfile.post('/ProductionTaskList', jsonParser, async (req, res, next) => {
    // console.log('requiredtype',req.body);
    try {
      mchQueryMod(`SELECT n.TaskNo, m1.Mtrl_Code, m1.Operation, m1.NestCount, m1.NoOfDwgs, m1.DwgsNested, m1.PartsNested, m1.TotalParts, m1.Priority, m1.EstimatedTime, SUM(n.qty) AS NoOfSheets
      FROM magodmis.ncprograms n
      JOIN magodmis.nc_task_list m1 ON n.TaskNo = m1.TaskNo
      JOIN magodmis.orderschedule o ON o.ScheduleId = m1.ScheduleId
      WHERE (n.PStatus = 'Cutting' OR n.PStatus = 'Completed')
        AND o.Type = '${req.body.Type}'
      GROUP BY n.TaskNo
      `, (err, data) => {
        if (err) logger.error(err);
        console.log(data.length)
        res.send(data)
      })
    } catch (error) {
      next(error)
    }
  });

  //MachineLog
  shiftManagerProfile.post('/machineLog', jsonParser, async (req, res, next) => {
    console.log('requiredtype',req.body);
    try {
        const firstQuery = `SELECT magodmis.shiftlogbook.*, magodmis.shiftregister.Shift, magodmis.shiftregister.ShiftID,
        (TIMESTAMPDIFF(MINUTE, magodmis.shiftlogbook.FromTime, magodmis.shiftlogbook.ToTime)) AS MachineTime
      FROM magodmis.shiftlogbook
      JOIN magodmis.shiftregister ON magodmis.shiftlogbook.ShiftID = magodmis.shiftregister.ShiftID
      WHERE magodmis.shiftlogbook.FromTime >= CONCAT('${req.body.Date}', ' 06:00:00')
          AND magodmis.shiftlogbook.ToTime < CONCAT(DATE_ADD('${req.body.Date}', INTERVAL 1 DAY), ' 06:00:00')
          AND magodmis.shiftlogbook.TaskNo != '100'
          AND magodmis.shiftlogbook.Machine='${req.body.Machine.MachineName}'`;
    
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


module.exports = shiftManagerProfile;