const machineAllotmentService = require("express").Router();
const { misQuery, setupQuery, misQueryMod, mchQueryMod , productionQueryMod } = require('../../helpers/dbconn');
const { logger } = require('../../helpers/logger')
var bodyParser = require('body-parser')
const moment = require('moment')

var jsonParser = bodyParser.json() 

function delay(time) { 
    return new Promise(resolve => setTimeout(resolve, time));
  }


  machineAllotmentService.get('/MachineswithLoadService', async (req, res, next) => { 
    let outputArray = []
    try {
        misQueryMod(`SELECT distinct m.refName , m.Machine_srl FROM machine_data.machine_list m,
        machine_data.machine_process_list m1,machine_data.operationslist o,
         machine_data.service_operationslist p 
         WHERE m1.Machine_srl=m.Machine_srl AND o.Operation=m1.RefProcess 
         AND m.Working AND p.OperationId=o.OperationID`, async (err, data) => { 
            if (err) logger.error(err);
            //console.log('data length is ' , data.length)
           for (let i =0 ; i<data.length ; i++) {
                let customObject = {MachineName : "" , process : [], load : 0, hours :0 , minutes:0, formattedLoad : ""}
                customObject.MachineName = data[i].refName 

                let load = 0 ;
                try {
                   // console.log(req.body.MachineName.MachineName)
                     misQueryMod(` SELECT ncp.EstimatedTime  FROM magodmis.ncprograms ncp
                     where ncp.Machine = '${data[i].refName}' && (PStatus = 'Created' || PStatus = 'MtrlReturn' || PStatus = 'Cutting' || PStatus = 'Mtrl Issue' || PStatus = 'Processing')`, (err, dataNCP) => {
                         if (err) logger.error(err);
                        /// console.log( data[i].refName , dataNCP.length)
                         if(dataNCP.length > 0){
                            //console.log('contains nc program data' , data[i].refName)
                            
                            for(let b=0;b<dataNCP.length;b++) {
                                //console.log('Estimated Time is' , dataNCP[b].EstimatedTime) 
                                load = load + dataNCP[b].EstimatedTime

                            }
                         } 
                     })
                 } catch (error) { 
                     next(error)
                 }
                 await delay(800)
                 customObject.load = load
                 const hours =Math.floor(load/60)
                 const minutes = load %60
                 let newminutes = "default"
                 let newhours = "default"
                 if(minutes<=9) {
                    newminutes = "0" + minutes
                 } else {
                    newminutes = minutes
                 }

                 if(hours<=9) {
                    newhours = "0" + hours
                 } else {
                    newhours = hours
                 }
                 customObject.minutes = load
                 customObject.formattedLoad = newhours + ":" + newminutes
                //getting processForMachine
                let processload = 0 ;
                try {
                    mchQueryMod(`select RefProcess from machine_process_list where Machine_srl='${data[i].Machine_srl}'`, async (err, datanew) => {
                        if (err) logger.error(err);
                        console.log('PROCESS FOR MACHINE' , data[i].refName, + " " + datanew.length)
                        for(let k =0 ; k<datanew.length ; k++) {
                            console.log(datanew[k]) 

                            //calculating load for each process
                            try {
                               
                                 misQueryMod(` SELECT SUM(EstimatedTime) AS TotalLoad FROM magodmis.ncprograms ncp where ncp.Machine = '${data[i].refName}' && ncp.Operation = '${datanew[k].RefProcess}' && (PStatus = 'Created' || PStatus = 'MtrlReturn' || PStatus = 'Cutting' || PStatus = 'Mtrl Issue' || PStatus = 'Processing');`, (err, datasum) => {
                                     if (err) logger.error(err);
                                     console.log('datasum' , datasum)

                                        const prochours =Math.floor(datasum[0].TotalLoad/60)
                                        const procminutes = datasum[0].TotalLoad %60
                                        console.log(prochours)
                                        console.log(procminutes)
                                        let procnewminutes = "default"
                                        let procnewhours = "default"
                                        if(procminutes<=9) {
                                            procnewminutes = "0" + procminutes
                                        } else {
                                            procnewminutes = procminutes
                                        }

                                        if(prochours<=9) {
                                            procnewhours = "0" + prochours
                                        } else {
                                            procnewhours = prochours
                                        }
                                       // customObject.minutes = load
                                      //  customObject.formattedLoad = procnewhours.toString() + ":" + procnewminutes.toString()
                                    // res.send(data)
                                    datanew[k].processLoad = datasum
                                    datanew[k].formattedLoad = procnewhours.toString()  + ":" + procnewminutes.toString()

                                 })
                             } catch (error) {
                                 next(error)
                             }
                            
                            customObject.process.push(datanew[k])
                            
                        }
                        
                       // res.send(data)
                    })
                } catch (error) { 
                    next(error)
                }
                await delay(600)
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

// NCprogram tab table data for machine
machineAllotmentService.post('/getNCprogramTabTableData', jsonParser ,  async (req, res, next) => {
    console.log('/getNCprogramTabTableData request is ' , req.body)
    try {
       console.log(req.body.MachineName.MachineName)
        misQueryMod(` SELECT * , c.Cust_name  FROM magodmis.ncprograms ncp
        inner join magodmis.cust_data c on c.Cust_Code = ncp.Cust_Code
        where ncp.Machine = '${req.body.MachineName.MachineName}' && (PStatus = 'Cutting' || PStatus = 'Mtrl Issue' || PStatus = 'Created' || PStatus = 'Processing' || PStatus = 'Mtrl Return')`, (err, data) => {
            if (err) logger.error(err);
            //console.log(data)
            res.send(data)
        })
    } catch (error) {
        next(error)
    }

    //res.send('Request Recieved')  
}); 

machineAllotmentService.get('/machineAllotmentServiceSchedule', jsonParser ,  async (req, res, next) => {
    console.log('/machineAllotmentSchedule')
         try {
      // console.log(req.body.MachineName.MachineName)
        misQueryMod(`SELECT os.* , c.Cust_name FROM magodmis.orderschedule os
        join magodmis.cust_data c on c.Cust_Code = os.Cust_Code
         where os.Type = 'Service' && ( os.Schedule_Status = 'Production' || os.Schedule_Status = 'Programmed' || os.Schedule_Status = 'Tasked') `, (err, data) => {
            if (err) logger.error(err);
            //console.log(data.length)
            res.send(data)  
        })
    } catch (error) {
        next(error) 
    } 
    
    //res.send('Request Recieved')   
});

machineAllotmentService.post('/machineAllotmentScheduleTableFormMachinesService', jsonParser ,  async (req, res, next) => {
    console.log('/machineAllotmentScheduleTableFormMachines')

    console.log(req.body.Operation)
         try {
        misQueryMod(`SELECT distinct m.refName , m.Machine_srl FROM machine_data.machine_list m,
        machine_data.machine_process_list m1,machine_data.operationslist o,
        machine_data.service_operationslist p 
         WHERE m1.Machine_srl=m.Machine_srl AND o.Operation=m1.RefProcess 
         AND m.Working AND p.OperationId=o.OperationID AND o.Operation='${req.body.Operation}'`, (err, data) => {
            if (err) logger.error(err);
            console.log(data)
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
    
    //res.send('Request Recieved')  
});


module.exports = machineAllotmentService;