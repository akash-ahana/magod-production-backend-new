const scheduleListService = require("express").Router();
const { misQuery, setupQuery, misQueryMod, mchQueryMod } = require('../../helpers/dbconn');
const { logger } = require('../../helpers/logger')
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()

scheduleListService.get('/schedulesList', async (req, res, next) => {
    try {
        misQueryMod(`select osd.OrdSchNo, c.Cust_name, osd.schTgtDate, osd.Delivery_Date ,  osd.Schedule_Status , ol.Type from magodmis.orderschedule osd
        inner join magodmis.cust_data c on c.Cust_Code = osd.Cust_Code
        inner join magodmis.order_list ol on ol.Order_No = osd.Order_No
        where ol.Type = 'Service'`, (err, data) => {
            if (err) logger.error(err);
            console.log('data length is ' , data.length)
            const slicedArray = data.slice(0, 200);
            res.send(slicedArray)
        })
    } catch (error) {
        next(error)
    }


});

scheduleListService.post('/schedulesListSecondTableService', jsonParser ,  async (req, res, next) => {
    console.log('schedulesListSecondTablesService' , req.body)
    try {
        misQueryMod(`SELECT * FROM magodmis.nc_task_list where ScheduleNo = '${req.body.ScheduleID}' `, (err, data) => {
            if (err) logger.error(err);
            console.log('response' , data)  
            res.send(data) 
        }) 
    } catch (error) {
        next(error)    
    }
}); 

scheduleListService.get('/schedulesListStatusProgrammedService', async (req, res, next) => {
    console.log('Request Done to Get Schedule List Profile Table ')
    try {
        misQueryMod(`select * , c.Cust_name from magodmis.orderschedule osd inner join magodmis.cust_data c on c.Cust_Code = osd.Cust_Code where osd.Type='Profile' && osd.Schedule_Status = 'Programmed'  order by osd.Delivery_date`, (err, data) => {
            if (err) logger.error(err);
            console.log(data.length)  
            //const slicedArray = data.slice(0, 200); 
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

scheduleListService.get('/schedulesListStatusCompletedService', async (req, res, next) => {
    console.log('Request Done to Get Schedule List Profile Table ')
    try {
        misQueryMod(`select * , c.Cust_name from magodmis.orderschedule osd inner join magodmis.cust_data c on c.Cust_Code = osd.Cust_Code where osd.Type='Profile' && osd.Schedule_Status = 'Completed'  order by osd.Delivery_date`, (err, data) => {
            if (err) logger.error(err);
            console.log(data.length)
            //const slicedArray = data.slice(0, 200); 
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

scheduleListService.get('/schedulesListStatusProductionService', async (req, res, next) => {
    console.log('Request Done to Get Schedule List Profile Table ')
    try {
        misQueryMod(`select * , c.Cust_name from magodmis.orderschedule osd inner join magodmis.cust_data c on c.Cust_Code = osd.Cust_Code where osd.Type='Profile' && osd.Schedule_Status = 'Production'  order by osd.Delivery_date`, (err, data) => {
            if (err) logger.error(err);
            console.log(data.length)
            //const slicedArray = data.slice(0, 200); 
            res.send(data)
        })
    } catch (error) { 
        next(error)  
    }
});

scheduleListService.get('/schedulesListStatusTaskedService', async (req, res, next) => {
    console.log('Request Done to Get Schedule List Profile Table ')
    try {
        misQueryMod(`select * , c.Cust_name from magodmis.orderschedule osd inner join magodmis.cust_data c on c.Cust_Code = osd.Cust_Code where osd.Type='Profile' && osd.Schedule_Status = 'Tasked'  order by osd.Delivery_date`, (err, data) => {
            if (err) logger.error(err);
            console.log(data.length)
            //const slicedArray = data.slice(0, 200);  
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

scheduleListService.get('/schedulesListStatusProgrammedService', async (req, res, next) => {
    console.log('Request Done to Get Schedule List Profile Table ')
    try {
        misQueryMod(`select * , c.Cust_name from magodmis.orderschedule osd inner join magodmis.cust_data c on c.Cust_Code = osd.Cust_Code where osd.Type='Profile' && osd.Schedule_Status = 'Programmed'  order by osd.Delivery_date`, (err, data) => {
            if (err) logger.error(err);
            console.log(data.length)
            //const slicedArray = data.slice(0, 200); 
            res.send(data)
        })
    } catch (error) {
        next(error) 
    }
});


module.exports = scheduleListService;