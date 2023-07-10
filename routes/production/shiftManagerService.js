const shiftManagerService = require("express").Router();
const { misQuery, setupQuery, misQueryMod, mchQueryMod , productionQueryMod } = require('../../helpers/dbconn');
const { logger } = require('../../helpers/logger')
var bodyParser = require('body-parser')
const moment = require('moment')

var jsonParser = bodyParser.json()

function delay(time) { 
    return new Promise(resolve => setTimeout(resolve, time));
  }

  shiftManagerService.get('/serviceListMachinesTaskNo', async (req, res, next) => {
    console.log('OnClick of Machines')
    let outputArray = []
    try {
        misQueryMod(`SELECT distinct m.refName , m.Machine_srl FROM machine_data.machine_list m,
        machine_data.machine_process_list m1,machine_data.operationslist o,
         machine_data.service_operationslist p 
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

shiftManagerService.post('/shiftManagerServiceFilteredMachines', jsonParser ,  async (req, res, next) => {
    console.log('/machineAllotmentScheduleTableFormMachines')

    console.log(req.body.Operation)
         try {
        misQueryMod(`SELECT distinct m.refName , m.Machine_srl FROM machine_data.machine_list m,
        machine_data.machine_process_list m1,machine_data.operationslist o,
         machine_data.service_operationslist p 
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

shiftManagerService.get('/orderByOperationsService', jsonParser ,  async (req, res, next) => {
    let outputArray = []
   //console.log('/profileListMachinesProgramesProcessing' , req.body)
    try {
        mchQueryMod(`SELECT ol.Operation, ol.ProcessId FROM machine_data.service_operationslist pcol
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

shiftManagerService.get('/orderByCustomersService', jsonParser ,  async (req, res, next) => {
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

shiftManagerService.post('/ProductionTaskList', jsonParser, async (req, res, next) => {
    console.log('requiredtype',req.body);
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



  module.exports = shiftManagerService;