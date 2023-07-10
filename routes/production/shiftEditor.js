const shiftEditor = require("express").Router();
const { misQuery, setupQuery, misQueryMod, mchQueryMod , productionQueryMod } = require('../../helpers/dbconn');
const { logger } = require('../../helpers/logger')
var bodyParser = require('body-parser')
const moment = require('moment')

// create application/json parser
var jsonParser = bodyParser.json() 


// Returns the type of Shifts - First, Second , Third , General, Special
shiftEditor.get('/typesOfShifts', async (req, res, next) => {
    console.log('Types of Shifts Request')
    const shifts = [ "First" , "Second" , "Third" , "General" , "Special"]
    res.send(shifts)  
});

//Returns the types of shifts and their timings
shiftEditor.get('/shiftTimings', async (req, res, next) => {
    try {
        const shiftInchargeNames = [];
        productionQueryMod("Select * from magod_production.shiftdb", (err, data) => {
            if (err) logger.error(err);
            // for (let i = 0; i < data.length; i++) {
            //     shiftInchargeNames[i] = data[i].Name
            //   }
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});


//Returns the List of ShiftIncharges , in the organisation
shiftEditor.get('/shiftInchargeList', async (req, res, next) => {
    console.log('Shift Incharge List Requested')
    try {
        const shiftInchargeNames = [];
        productionQueryMod("Select Name from magod_production.shift_ic_list", (err, data) => {
            if (err) logger.error(err);
            for (let i = 0; i < data.length; i++) {
                shiftInchargeNames[i] = data[i].Name
              }
            res.send(shiftInchargeNames)
        })
    } catch (error) {
        next(error)
    }
});

// Creates Weekly Shift Planner 
shiftEditor.post('/createWeeklyShiftPlan', jsonParser ,  async (req, res, next) => {
    console.log('CREATE WEEKLY SHIFT PLAN REQUEST' , req.body)
    letinputArray = req.body 
   // console.log('Input array after adding from time date format change' , letinputArray)


    for(let i =0 ; i<letinputArray.length; i++) {   
        if(letinputArray[i].isChecked === false) { 
            try {
                misQueryMod(` SELECT * FROM day_shiftregister where ShiftDate='${letinputArray[i].ShiftDate}' && Shift='${letinputArray[i].Shift}'`, (err, data) => {
                    if (err) logger.error(err);
                    //console.log(data)
                    if(data.length===0){
                        console.log('Shift Plan is not calculated')  
                        
                            if (letinputArray[i].isChecked === false) {
                                try {
                                    misQueryMod(`INSERT INTO day_shiftregister (ShiftDate, Shift, FromTime, ToTime, Shift_Ic) VALUES ('${letinputArray[i].ShiftDate}' , '${letinputArray[i].Shift}' , '${letinputArray[i].FromTime}' , '${letinputArray[i].ToTime}' , '${letinputArray[i].Shift_Ic}' )`, (err, data) => {
                                        if (err) logger.error(err);
                                        //console.log(data)
                                        // res.send(data)
                                    })
                                } catch (error) {
                                    next(error)
                                }
                            }
                        
                    }
                    //res.send(data)
                })
            } catch (error) {
                next(error)
            }  
        }
    }
    
    res.send('All Records Saved to THe DB')
    
});


 

//4th Row First Table 
shiftEditor.post('/getDailyShiftPlanTable', jsonParser ,  async (req, res, next) => {
    
   // console.log('/getDailyShiftPlanTable' , req.body)
    if(req.body === '') {
        res.send(null)
    } else {
        try { 

            let dateSplit = req.body.ShiftDate.item.split("/");
            let year = dateSplit[2];
            let month = dateSplit[1];
            let day = dateSplit[0];
            let finalDay = year+"-"+month+"-"+day
       
            misQueryMod(` SELECT * FROM day_shiftregister WHERE ShiftDate='${finalDay}'`, (err, data) => {
                if (err) logger.error(err); 

                //console.log('/getWeeklyShiftPlanSecondTable RESPONSE IS' , data)
                if(data === null ) {
                    console.log('DATA IS EMPTY')
                }  else {
                    console.log('DATA IS PRESENT') 
                    // for(let i = 0 ; i < data.length ; i++) {
                    //     let dateSplit = data[i].ShiftDate.split("-");
                    //     let year = dateSplit[2];
                    //     let month = dateSplit[1];
                    //     let day = dateSplit[0];
                    //     let finalDay = year+"-"+month+"-"+day 
                    //     console.log( 'RESPONSE SHIFT DATE IS ' , finalDay)
                    //     data[i].ShiftDate = finalDay 

                    //     let dateSplitFromTime = data[i].FromTime.split("-");
                    //     console.log( ' DATE SPLIT RESPONSE From tIME IS ' , dateSplitFromTime)
                    //     let yearFromTime = dateSplitFromTime[0];
                    //     let monthFromTime = dateSplitFromTime[1];
                    //     let dayFromTimeINITIAL = dateSplitFromTime[2].split(" ");
                    //     let dayFromTimeFinal = dayFromTimeINITIAL[0]
                    //     let time = dayFromTimeINITIAL[1]
                    //     let finalDayFromTime = dayFromTimeFinal+"-"+monthFromTime+"-"+yearFromTime+" "+time
                    //     console.log( 'RESPONSE From tIME IS ' , finalDayFromTime)
                    //     data[i].FromTime = finalDayFromTime 

                    //     let dateSplitToTime = data[i].ToTime.split("-");
                    //     console.log( ' DATE SPLIT RESPONSE To tIME IS ' , dateSplitToTime)
                    //     let yearToTime = dateSplitToTime[0];
                    //     let monthToTime = dateSplitToTime[1];
                    //     let dayToTimeINITIAL = dateSplitToTime[2].split(" ");
                    //     let dayToTimeFinal = dayToTimeINITIAL[0]
                    //     let time1 = dayToTimeINITIAL[1]
                    //     let finalDayToTime= dayToTimeFinal+"-"+monthToTime+"-"+yearToTime+" "+time
                    //     console.log( 'RESPONSE To tIME IS ' , finalDayToTime)
                    //     data[i].ToTime = finalDayToTime 
                    //     //data[i].FromTime = finalDayFromTime 

                    // } 
                } 
                res.send(data)
               
            })
        } catch (error) {
            next(error)
        }
}
});

// Gets Information of weekly shift plan

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
  } 


 shiftEditor.post('/getWeeklyShiftPlanSecondTable', jsonParser ,  async (req, res, next) => {
    //delay is given so that as soon as the data is created from create week shift , the table has to get populated with all the records 
    console.log('/getWeeklyShiftPlanSecondTable REQUEST IS ' , req.body)
    await delay(200);
    let newDates = [];
    if(req.body === '') {
        res.send(null)   
    } else {
        for(let i=0; i<req.body.length; i++) {
                    //console.log(letinputArray[i].ShiftDate)
                    let dateSplit = req.body[i].split("/");
                  let year = dateSplit[2];
                  let month = dateSplit[1];
                  let day = dateSplit[0];
                  let finalDay = year+"-"+month+"-"+day
                  req.body[i].ShiftDatae = finalDay
                  newDates.push(finalDay)
                  //console.log(finalDay)   
                }

                //console.log('new Daate is ', newDates)

                try {
       
                        misQueryMod(` SELECT * FROM day_shiftregister WHERE ShiftDate='${newDates[0]}' || ShiftDate='${newDates[1]}' || ShiftDate='${newDates[2]}' || ShiftDate='${newDates[3]}' || ShiftDate='${newDates[4]}' || ShiftDate='${newDates[5]}' || ShiftDate='${newDates[6]}'`, (err, data) => {
                            if (err) logger.error(err);
                            
                            //console.log('/getWeeklyShiftPlanSecondTable RESPONSE IS' , data)
                            if(data === null) {
                              //  console.log('DATA IS EMPTY')
                            } else {
                                console.log('DATA IS PRESENT')
                                for(let i =0 ; i < data.length ; i++) {
                                    let dateSplit = data[i].ShiftDate.split("-");
                                    let year = dateSplit[2];
                                    let month = dateSplit[1];
                                    let day = dateSplit[0];
                                    let finalDay = year+"-"+month+"-"+day 
                                   // console.log( 'RESPONSE SHIFT DATE IS ' , finalDay)
                                    data[i].ShiftDate = finalDay 
            
                                    let dateSplitFromTime = data[i].FromTime.split("-");
                                    //console.log( ' DATE SPLIT RESPONSE From tIME IS ' , dateSplitFromTime)
                                    let yearFromTime = dateSplitFromTime[0];
                                    let monthFromTime = dateSplitFromTime[1];
                                    let dayFromTimeINITIAL = dateSplitFromTime[2].split(" ");
                                    let dayFromTimeFinal = dayFromTimeINITIAL[0]
                                    let time = dayFromTimeINITIAL[1]
                                    let finalDayFromTime = dayFromTimeFinal+"-"+monthFromTime+"-"+yearFromTime+" "+time
                                    //console.log( 'RESPONSE From tIME IS ' , finalDayFromTime)
                                    data[i].FromTime = finalDayFromTime 
            
                                    let dateSplitToTime = data[i].ToTime.split("-");
                                    console.log( ' DATE SPLIT RESPONSE To tIME IS ' , dateSplitToTime)
                                    let yearToTime = dateSplitToTime[0];
                                    let monthToTime = dateSplitToTime[1];
                                    let dayToTimeINITIAL = dateSplitToTime[2].split(" ");
                                    let dayToTimeFinal = dayToTimeINITIAL[0]
                                    let time1 = dayToTimeINITIAL[1]
                                    let finalDayToTime= dayToTimeFinal+"-"+monthToTime+"-"+yearToTime+" "+time1
                                   // console.log( 'RESPONSE To tIME IS ' , finalDayToTime)
                                    data[i].ToTime = finalDayToTime 
                                    //data[i].FromTime = finalDayFromTime 
            
                                } 
                            }
                           // console.log('/getWeeklyShiftPlanSecondTable RESPONSE IS' , data)
                            res.send(data)
                            
                        })
                    } catch (error) {  
                        next(error)
                    }


    }
    
    // try {
       
    //     misQueryMod(` SELECT * FROM day_shiftregister WHERE ShiftDate > '${req.body[0].ShiftDate}' && ShiftDate < '${req.body[6].ShiftDate}'`, (err, data) => {
    //         if (err) logger.error(err);
            
    //         res.send(data)
    //         console.log('/getWeeklyShiftPlanSecondTable RESPONSE IS' , data)
    //     })
    // } catch (error) {
    //     next(error)
    // }
});

// Gets Information of the daily shift plan of a particular shift
shiftEditor.post('/getDailyShiftPlan', jsonParser ,  async (req, res, next) => {
    try { 
       
        misQueryMod(` SELECT * FROM day_shiftregister WHERE ShiftDate='${req.body.ShiftDate}' and Shift='${req.body.Shift}'`, (err, data) => {
            if (err) logger.error(err);
            
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

// Gets Information all the machine Operators
shiftEditor.get('/getMachineOperators', jsonParser ,  async (req, res, next) => {
   // console.log('/getMachineOperators REQUEST' , req.body)
    try {
       
        productionQueryMod(` SELECT * FROM magod_production.operator_list`, (err, data) => {
            if (err) logger.error(err);
            
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

// Gets Information all the machine Operators for a particular Shift
shiftEditor.post('/getMachineOperatorsShift', jsonParser ,  async (req, res, next) => {
    console.log('/getMachineOperatorsShift TABLE REQUEST' , req.body)
    //console.log('/getMachineOperatorsShift TABLE REQUEST - ', req.body.ShiftDate)
   // console.log(req.body.hasOwnProperty("ShiftId"));
    if(req.body.hasOwnProperty("DayShiftId")) {
        let dateSplit = req.body.ShiftDate.split("-");
        let year = dateSplit[2];
        let month = dateSplit[1];
        let day = dateSplit[0];
        let finalDay = year + "-" + month + "-" + day + " 00:00:00"
        console.log('RESPONSE SHIFT DATE IS ', finalDay)
        req.body.ShiftDate = finalDay

        try { 
       
            misQueryMod(` SELECT * FROM magodmis.shiftregister where ShiftDate ='${finalDay}' && Shift='${req.body.Shift}'`, (err, data) => {
                if (err) logger.error(err);  
                console.log(' /getMachineOperatorsShift TABLE Response ' , data)
                res.send(data) 
            })
        } catch (error) {
            next(error)  
        }
    } 
    
    //console.log(req.body.ShiftDate)
    
});

// Set Machine Operator For a Single Day 
shiftEditor.post('/setMachineOperatorDay', jsonParser ,  async (req, res, next) => {
    console.log('/setMachineOperatorDay  1 REQUEST' , req.body)  

    

    if(req.body.hasOwnProperty("ShiftDate")) {
       let dateSplit = req.body.ShiftDate.split("-");
        let year = dateSplit[2];
        let month = dateSplit[1];
        let day = dateSplit[0];
        let finalDay = year + "-" + month + "-" + day + " 00:00:00"
        //console.log('RESPONSE SHIFT DATE IS ', finalDay)
        req.body.ShiftDate = finalDay
    
        let dateSplitFromTime = req.body.FromTime.split("-");
        let yearFromTime = dateSplitFromTime[2];
        let monthFromTime = dateSplitFromTime[1];
        let dayFromTime = dateSplitFromTime[0];
        let yearSplit = yearFromTime.split(" ");
        let finalDayFromTime = yearSplit[0] + "-" + monthFromTime + "-" + dayFromTime + " " + yearSplit[1]
       // console.log('RESPONSE SHIFT From Time  IS ', finalDayFromTime)
        req.body.FromTime = finalDayFromTime

        let dateSplitToTime = req.body.ToTime.split("-");
        let yearToTime = dateSplitToTime[2];
        let monthToTime = dateSplitToTime[1];
        let dayToTime = dateSplitToTime[0];
        let yearSplit1 = yearToTime.split(" ");
        let finalDayToTime = yearSplit1[0] + "-" + monthToTime + "-" + dayToTime + " " + yearSplit1[1]
        //console.log('RESPONSE SHIFT From Time  IS ', finalDayToTime)
        req.body.ToTime = finalDayFromTime

        console.log('after date conversions ' , req.body)
    
        try {
            misQueryMod(` INSERT INTO magodmis.shiftregister (ShiftDate, Shift, FromTime, ToTime, Machine, Operator, DayShiftID) VALUES 
            ('${req.body.ShiftDate}' , '${req.body.Shift}' , '${req.body.FromTime}' , '${req.body.ToTime}' , '${req.body.Machine}' , '${req.body.Operator}' , '${req.body.DayShiftID}')`, (err, data) => {
                if (err) logger.error(err); 
                console.log(data)
                res.send(data) 
            })
        } catch (error) {  
            next(error)   
        }

    } else {  
        res.send('request is null so response is null')
    } 
});

// Delete Machine Operator For a Single Day 
shiftEditor.post('/deleteMachineOperatorDay', jsonParser ,  async (req, res, next) => {
  //  console.log('/deleteMachineOperatorDay REQUEST' , req.body)
    try {
        misQueryMod(`DELETE FROM magodmis.shiftregister WHERE DayShiftID='${req.body.DayShiftID}' && Shift='${req.body.Shift}' && Machine='${req.body.Machine}' && Operator='${req.body.Operator}';`, (err, data) => {
            if (err) logger.error(err); 
          //  console.log(data)
            res.send(data) 
        })
    } catch (error) {
        next(error) 
    }
    
});

// Update Single Day Shift - Shift Incharge 
shiftEditor.post('/updateSingleDaySihiftIncharge', jsonParser ,  async (req, res, next) => {
    console.log('/updateSingleDaySihiftIncharge REQUEST' , req.body)

    try {
       
        misQueryMod(` UPDATE  magodmis.day_shiftregister 
        SET Shift_Ic = '${req.body.newShift_Ic}'
        WHERE DayShiftId='${req.body.DayShiftId}'`, (err, data) => {
            if (err) logger.error(err);
            console.log(data)
            res.send(data)
        })
    } catch (error) {
        next(error)
    }

    //res.send('Request Recieved')
    
    
});

// Update Single Day Shift - Shift Instructions
shiftEditor.post('/updateSingleDaySihiftInstructions', jsonParser ,  async (req, res, next) => {
    //console.log('/updateSingleDaySihiftInstructions REQUEST' , req.body)

    try {
       
        misQueryMod(` UPDATE  magodmis.day_shiftregister 
        SET Shift_instruction = '${req.body.shiftInstruction}'
        WHERE DayShiftId='${req.body.DayShiftId}'`, (err, data) => {
            if (err) logger.error(err);
           // console.log(data)
            res.send(data)
        }) 
    } catch (error) {
        next(error)  
    }

    //res.send('Request Recieved')
    
    
});

//Delete Operator For Week
shiftEditor.post('/deleteWeekOperatorForMachine', jsonParser ,  async (req, res, next) => {
    //console.log('/deleteWeekOperatorForMachine REQUEST' , req.body)

    let letinputArray = req.body.selectedWeek

    for(let i=0; i<letinputArray.length; i++) {
        //console.log(letinputArray[i].ShiftDate)
        let dateSplit = letinputArray[i].split("/");
      let year = dateSplit[2];
      let month = dateSplit[1];
      let day = dateSplit[0];
      let finalDay = year+"-"+month+"-"+day
      letinputArray[i] = finalDay + " 00:00:00"
      //console.log(finalDay) 
    }

   // console.log('After Date Conversion ' , letinputArray)

    for(let i =0; i<letinputArray.length;i++) {

        try {
       
        misQueryMod(` DELETE FROM magodmis.shiftregister WHERE Shift='${req.body.selectedShift}' && ShiftDate='${letinputArray[i]}' && Machine='${req.body.selectedMachine}' `, (err, data) => {
            if (err) logger.error(err);
            //console.log(data)
            //res.send(data)
        })
    } catch (error) { 
        next(error)
    } 

    } 

    

    res.send('Deleted Week Shift Operators')  
});


// Delete Week Shift 
shiftEditor.post('/deleteWeekShift', jsonParser ,  async (req, res, next) => {
    console.log('/deleteWeekShift REQUEST' , req.body)

    let letinputArray = req.body.selectedWeek

    for(let i=0; i<letinputArray.length; i++) {
        //console.log(letinputArray[i].ShiftDate)
        let dateSplit = letinputArray[i].split("/");
      let year = dateSplit[2];
      let month = dateSplit[1];
      let day = dateSplit[0];
      let finalDay = year+"-"+month+"-"+day
      letinputArray[i] = finalDay
      //console.log(finalDay) 
    }

   // console.log('After Date Conversion ' , letinputArray)

    for(let i =0; i<letinputArray.length;i++) {

        try {
       
            misQueryMod(` DELETE FROM magodmis.shiftregister WHERE Shift='${req.body.selectedShift}' && ShiftDate='${letinputArray[i] + " 00:00:00"}'  `, (err, data) => {
                if (err) logger.error(err);
               // console.log(data)
                //res.send(data)
            })
        } catch (error) { 
            next(error)
        } 

        try {
       
        misQueryMod(` DELETE FROM magodmis.day_shiftregister WHERE Shift='${req.body.selectedShift}' && ShiftDate = '${letinputArray[i]}'`, (err, data) => {
            if (err) logger.error(err);
            //console.log(data)
            //res.send(data)
        })
    } catch (error) {
        next(error)
    }

    } 

    

    res.send('Deleted Week Shift ')  
});



// Delete Single Day Shift 
shiftEditor.post('/deleteSingleDayShift', jsonParser ,  async (req, res, next) => {
    //console.log('/deleteSingleDayShift REQUEST' , req.body)

    try {
       
        misQueryMod(` DELETE FROM magodmis.day_shiftregister WHERE DayShiftId='${req.body.DayShiftId}'`, (err, data) => {
            if (err) logger.error(err);
            //console.log(data)
            res.send(data)
        })
    } catch (error) {
        next(error)
    }

    //res.send('Request Recieved')  
});

// Sets machine with operator and shift plan
//magodmis.shiftregister
shiftEditor.post('/setMachineOperators', jsonParser ,  async (req, res, next) => {
    console.log('/setMachineOperators' , req.body)
    letinputArray = req.body
    for(let i=0; i<letinputArray.length; i++) {
        //console.log(letinputArray[i].ShiftDate)
        let dateSplit = letinputArray[i].ShiftDate.split("/");
      let year = dateSplit[2];
      let month = dateSplit[1];
      let day = dateSplit[0];
      let finalDay = year+"-"+month+"-"+day 
      letinputArray[i].ShiftDate = finalDay
      //console.log(finalDay) 
    }
    console.log('Input array after date format change' , letinputArray)
    let newArr2;
    let fromTime =0;
    let toTime =0;
    if(req.body.length > 0) {
        if(letinputArray[0].Shift === "First") {
            fromTime = " 06:00:00",
            toTime = " 14:00:00" 
        }
        if(letinputArray[0].Shift === "Second") {
            fromTime = " 14:00:00",
            toTime = " 22:00:00"
        }
        if(letinputArray[0].Shift === "Third") {
            fromTime = " 22:00:00",
            toTime = " 06:00:00"
        }
        if(letinputArray[0].Shift === "General") {
            fromTime = " 09:00:00",
            toTime = " 17:00:00"
        }
        for(let i=0; i<letinputArray.length; i++) {
            letinputArray[i].FromTime = letinputArray[i].ShiftDate + fromTime
            letinputArray[i].ToTime = letinputArray[i].ShiftDate + toTime
            letinputArray[i].ShiftDate = letinputArray[i].ShiftDate + " 00:00:00" 
        }  
    } 

    console.log('Input array after adding from time date format change' , letinputArray)
    for(let i =0 ; i<letinputArray.length; i++) { 
        //console.log('final for loop for query ' , i)
        if(letinputArray[i].isChecked === false) {

            //console.log('Inside If loop for isChecked ' , i , " " , letinputArray[i].ShiftDate, letinputArray[i].Shift)
            let dayShiftID = 0; 
            try {
                //checking if shift is created 
                misQueryMod(` SELECT * FROM day_shiftregister WHERE ShiftDate='${letinputArray[i].ShiftDate}' and Shift='${letinputArray[i].Shift}'`, (err, data) => {
                    if (err) logger.error(err);
                    console.log('day_shiftregister Response IS' , data)
                    dayShiftID = data[0].DayShiftId  
                    console.log( " Shift Date is " , letinputArray[i].ShiftDate)
                    console.log( " DayShiftID is " , data[0].DayShiftId)

                    try {
                       
                        misQueryMod(` INSERT INTO magodmis.shiftregister (ShiftDate, Shift, FromTime, ToTime, Machine, Operator, DayShiftID) VALUES 
                        ('${letinputArray[i].ShiftDate}' , '${letinputArray[i].Shift}' , '${letinputArray[i].FromTime}' , '${letinputArray[i].ToTime}' , '${letinputArray[i].Machine}' , '${letinputArray[i].Operator}' , '${dayShiftID}')`, (err, data) => {
                            if (err) logger.error(err); 
                            console.log('Response After Insert Query Set MAchine Operators' , data)   
                            //res.send(data)
                        })
                    } catch (error) {
                        next(error) 
                    }
                    
                   //res.send(data)
                })
            } catch (error) {
                next(error)
            }
        }
        
        
        
    }
    
    //console.log(dayShiftID)
   // console.log('dayShiftID response is ')
    res.send('All records for set machine operators saved to the db')  
});

// getSingleDayDetailShiftInformation
shiftEditor.post('/getSingleDayDetailShiftInformation', jsonParser ,  async (req, res, next) => {
    //console.log('/getSingleDayDetailShiftInformation REQUEST' , req.body)
    let dateSplit = req.body.ShiftDate.split("-");
    let year = dateSplit[2];
    let month = dateSplit[1];
    let day = dateSplit[0];    
    let finalDay = year+"-"+month+"-"+day
   // console.log('After Date Conversion', finalDay)

    let outputArray = []

    try {
        misQueryMod(` select * FROM magodmis.day_shiftregister WHERE ShiftDate='${finalDay}'`, async (err, data) => {
            if (err) logger.error(err);
            
            console.log(data.length)
            for(let i =0 ; i<data.length;i++) {
                let customObject = {ShiftIc : "" , Shift: "" ,  machineOperators : []}
                customObject.ShiftIc = data[i].Shift_Ic
                customObject.Shift = data[i].Shift

                //getting processForMachine
                
                 try {
                    misQueryMod(`select * FROM magodmis.shiftregister WHERE DayShiftID='${data[i].ShiftId}' && Shift='${data[i].Shift}'`, (err, datanew) => {
                        if (err) logger.error(err);
                       // console.log('Machine Operators For Shift IS' , datanew)
                        for(let k =0 ; k<datanew.length ; k++) {
                            customObject.machineOperators.push(datanew[k])
                        }
                    })
                } catch (error) {
                    next(error)
                }

                //console.log('CUSTOM OBJECT IS ' , customObject)


                outputArray.push(customObject)
            }

            await delay(1000)

            res.send(outputArray)
        })
    } catch (error) {
        next(error)
    }

    //res.send('Request Recieved')  
});

// getFullWeekDetailPlan
shiftEditor.post('/getFullWeekDetailPlan', jsonParser ,  async (req, res, next) => {
    //console.log('/getFullWeekDetailPlan' , req.body.ShiftDate)
    let inputArray  = req.body.ShiftDate
    let outputArray = []
   
    for (let i = 0 ; i < inputArray.length ; i++) {
        let dateSplit = inputArray[i].split("/"); 
        let year = dateSplit[2];
        let month = dateSplit[1];
        let day = dateSplit[0];    
        let finalDay = year+"-"+month+"-"+day   
        //console.log(finalDay)
        //inputArray[i] = finalDay
        let innerArray = []
       

        try {
            misQueryMod(` select * FROM magodmis.day_shiftregister WHERE ShiftDate='${finalDay}'`, async (err, data) => {
                if (err) logger.error(err);
                
                //console.log(data.length)
                for(let i =0 ; i<data.length;i++) {
                    let customObject = {ShiftIc : "" , Shift: "" , day: "",  machineOperators : []}
                    customObject.ShiftIc = data[i].Shift_Ic
                    customObject.Shift = data[i].Shift
                    let dateSplit = data[i].ShiftDate.split("-");
                    let year = dateSplit[0];
                    let month = dateSplit[1];
                    let day = dateSplit[2];    
                    let finalDay = day+"-"+month+"-"+year
                    customObject.day = finalDay 
    
                    //getting processForMachine
                    
                     try {
                        misQueryMod(`select * FROM magodmis.shiftregister WHERE DayShiftID='${data[i].ShiftId}' && Shift='${data[i].Shift}'`, (err, datanew) => {
                            if (err) logger.error(err);
                           // console.log('Machine Operators For Shift IS' , datanew)
                            for(let k =0 ; k<datanew.length ; k++) {
                                customObject.machineOperators.push(datanew[k])
                            }
                        })
                    } catch (error) {
                        next(error)
                    }
    
                   // console.log('CUSTOM OBJECT IS ' , customObject)
    
    
                    innerArray.push(customObject)
                }
    
                await delay(100)
                //ineerArray.push()
               
            })
        } catch (error) {
            next(error)
        }
        await delay(100)
        outputArray.push(innerArray)
    }
    await delay(100)
    res.send(outputArray)
   // console.log(inputArray)
   
    
    
   // res.send(inputArray)  
});



module.exports = shiftEditor; 