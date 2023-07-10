const machineAllotment = require("express").Router();
const { misQuery, setupQuery, misQueryMod, mchQueryMod , productionQueryMod } = require('../../helpers/dbconn');
const { logger } = require('../../helpers/logger')
var bodyParser = require('body-parser')
const moment = require('moment')

// create application/json parser
var jsonParser = bodyParser.json() 

function delay(time) { 
    return new Promise(resolve => setTimeout(resolve, time));
  }

// Gets Information all the machine Operators
// change the query - add active machine in where condition
machineAllotment.get('/getMachineProcess', jsonParser ,  async (req, res, next) => {
    
    console.log('/getMachineOperators REQUEST' , req.body)
    let outputArray = []
    let machineArray = []
    
    try {
        mchQueryMod(` SELECT * FROM machine_data.machine_list`, async (err, data) => {
            if (err) logger.error(err);
            
            console.log(data.length)
            for(let i =0 ; i<data.length;i++) {
                let customObject = {MachineName : "" , process : []}
                customObject.MachineName = data[i].refName

                //getting processForMachine
                
                 try {
                    mchQueryMod(`select * from machine_process_list where Machine_srl='${data[i].Machine_srl}'`, (err, datanew) => {
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

                console.log('CUSTOM OBJECT IS ' , customObject)


                outputArray.push(customObject)
            }

            await delay(1000)

            res.send(outputArray)
        })
    } catch (error) {
        next(error)
    }
});

machineAllotment.get('/profileListMachineswithLoad', async (req, res, next) => { 
    let outputArray = []
    try {
        misQueryMod(`SELECT distinct m.refName , m.Machine_srl FROM machine_data.machine_list m,
        machine_data.machine_process_list m1,machine_data.operationslist o,
         machine_data.profile_cuttingoperationslist p 
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
                 await delay(400)
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
machineAllotment.post('/getNCprogramTabTableDatauseEffect', jsonParser ,  async (req, res, next) => {
    console.log('/getNCprogramTabTableDatauseEffect request is ' , req.body.length)
    try {
       //console.log(req.body.MachineName.MachineName)
        misQueryMod(` SELECT * , c.Cust_name  FROM magodmis.ncprograms ncp
        inner join magodmis.cust_data c on c.Cust_Code = ncp.Cust_Code
        where ncp.Machine = '${req.body.MachineName}' && (PStatus = 'Created' || PStatus = 'MtrlReturn' || PStatus = 'Cutting' || PStatus = 'Mtrl Issue' || PStatus = 'Processing')`, (err, data) => {
            if (err) logger.error(err);
            console.log(data)
            res.send(data)
        })
    } catch (error) {
        next(error)
    }

    //res.send('Request Recieved')  
});



// NCprogram tab table data for machine
machineAllotment.post('/getNCprogramTabTableData', jsonParser ,  async (req, res, next) => {
    console.log('/getNCprogramTabTableData request is ' , req.body.length)
    try {
       console.log(req.body.MachineName.MachineName) 
        misQueryMod(` SELECT * , c.Cust_name  FROM magodmis.ncprograms ncp
        inner join magodmis.cust_data c on c.Cust_Code = ncp.Cust_Code
        where ncp.Machine = '${req.body.MachineName.MachineName}' && (PStatus = 'Created' || PStatus = 'MtrlReturn' || PStatus = 'Cutting' || PStatus = 'Mtrl Issue' || PStatus = 'Processing')`, (err, data) => {
            if (err) logger.error(err);
            console.log(data)
            res.send(data)
        })
    } catch (error) {
        next(error)
    }

    //res.send('Request Recieved')  
});

machineAllotment.get('/machineAllotmentSchedule', jsonParser ,  async (req, res, next) => {
    console.log('/machineAllotmentSchedule')

    
         try {
      // console.log(req.body.MachineName.MachineName)
        misQueryMod(`SELECT os.* , c.Cust_name FROM magodmis.orderschedule os
        join magodmis.cust_data c on c.Cust_Code = os.Cust_Code
         where os.Type = 'Profile' && ( os.Schedule_Status = 'Production' || os.Schedule_Status = 'Programmed' || os.Schedule_Status = 'Tasked') `, (err, data) => {
            if (err) logger.error(err);
            //console.log(data.length)
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
    
    //res.send('Request Recieved')  
});

machineAllotment.post('/machineAllotmentScheduleTableForm', jsonParser ,  async (req, res, next) => {
    console.log('/machineAllotmentScheduleTableForm' , req.body)

    // console.log(req.body.Operation)
         try {
      // console.log(req.body.MachineName.MachineName)
        misQueryMod(`SELECT ntl.* , c.Cust_name  FROM magodmis.nc_task_list ntl 
        join magodmis.cust_data c on c.Cust_Code = ntl.Cust_Code
        where ntl.ScheduleId = '${req.body.ScheduleId}' `, (err, data) => {
            if (err) logger.error(err);
            //console.log(data.length)
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
    
    //res.send('Request Recieved')  
});

machineAllotment.post('/machineAllotmentScheduleTableFormMachines', jsonParser ,  async (req, res, next) => {
    console.log('/machineAllotmentScheduleTableFormMachines')

    console.log(req.body.Operation)
         try {
        misQueryMod(`SELECT distinct m.refName , m.Machine_srl FROM machine_data.machine_list m,
        machine_data.machine_process_list m1,machine_data.operationslist o,
         machine_data.profile_cuttingoperationslist p 
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

machineAllotment.post('/changeMachineInForm', jsonParser ,  async (req, res, next) => {
    console.log('/changeMachineInForm')

    console.log(req.body.Operation)
         try {
        misQueryMod(`update magodmis.nc_task_list ntl 
        SET Machine = '${req.body.newMachine}' WHERE NcTaskId='${req.body.NcTaskId}';`, (err, data) => {
            if (err) logger.error(err);
            console.log(data)
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
    
    //res.send('Request Recieved')  
});

machineAllotment.post('/releaseForProgramming', jsonParser ,  async (req, res, next) => {
    console.log('/releaseForProgramming')
    console.log(req.body.Operation) 
         try {
        misQueryMod(`update magodmis.nc_task_list ntl 
        SET TStatus = 'Programming' WHERE NcTaskId='${req.body.NcTaskId}';`, (err, data) => {
            if (err) logger.error(err);
            console.log(data)
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

machineAllotment.post('/changeMachineHeaderButton', jsonParser ,  async (req, res, next) => {
    console.log('/changeMachineHeaderButton' , req.body)
    console.log('/changeMachineHeaderButton' , req.body.programs.length)

    for( let i =0 ; i< req.body.programs.length ; i++) {
        console.log('inside for loop' , req.body.programs[i].NCProgramNo)
        try {
            misQueryMod(`update magodmis.ncprograms 
            SET Machine = '${req.body.newMachine}' WHERE NCProgramNo='${req.body.programs[i].NCProgramNo}'`, (err, data) => {
                if (err) logger.error(err); 
                console.log(data)
                //res.send(data)
            })
        } catch (error) {
            next(error)
        } 
    }
    res.send('Request Recieved')  
});

machineAllotment.post('/formRefresh', jsonParser ,  async (req, res, next) => {
    console.log('/formRefresh')
    console.log(req.body)
         try {
        misQueryMod(`select * from magodmis.nc_task_list
         WHERE NcTaskId='${req.body.NcTaskId}'`, (err, data) => {
            if (err) logger.error(err);
            console.log(data)
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

module.exports = machineAllotment;