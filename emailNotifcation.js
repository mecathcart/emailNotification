  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dataSheet = ss.getSheets()[0];
  var dataRange = dataSheet.getRange(1, 1, dataSheet.getMaxRows(), 12);


  function makeOldSchedule(){
   if(ss.getSheetByName("Copy of Schedule") != null){
      ss.setActiveSheet(ss.getSheetByName("Copy of Schedule"));
       ss.deleteActiveSheet();
   
   }//end if clause
   
    var sheet = ss.getSheetByName("Schedule");
    var destination = ss;
    var oldSchedule = sheet.copyTo(destination);
  //  var oldScheduleRange = oldSchedule.getRange(1, 1, oldSchedule.getMaxRows(), 12);
  //  var oldObjects = getRowsData(oldSchedule, oldScheduleRange);
  //  Logger.log("I worked");
    
   return oldSchedule;
  }//ends makeOldScheudle Function
  
  
//oldObjects = makeOldSchedule();


function sendEmails() {

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dataSheet = ss.getSheets()[0];
  var dataRange = dataSheet.getRange(1, 1, dataSheet.getMaxRows(), 12);

  var templateSheet = ss.getSheets()[1];
  var emailTemplate = templateSheet.getRange("A1").getValue();

 
  var oldSchedule = ss.getSheetByName("Copy of Schedule");
  var oldScheduleRange = oldSchedule.getRange(1, 1, oldSchedule.getMaxRows(), 12);
  var oldObjects = getRowsData(oldSchedule, oldScheduleRange);
 
  
  objects = getRowsData(dataSheet, dataRange);
  
 
  // For every row object, create a personalized email from a template and send
  // it to the appropriate person.
  for (var i = 1; i < objects.length; ++i) {
    // Get a row object
    var rowData = objects[i];
    var oldRowData = oldObjects[i];
    
//    Logger.log(rowData[i]);
    if(rowData.tutor1 != oldRowData.tutor1|| rowData.tutor2 != oldRowData.tutor2 && rowData.studentName == oldRowData.studentName){
    
       // Logger.log("data was changed");
         if (rowData.tutor1 === "-") {
            Logger.log("Tutor 1 is not assigned");
            rowData.tutor1 = "Tutor 1 is not assigned.";
          } else if (rowData.tutor1 === "NS") {
            rowData.tutor1 = "Must see Ken Hyde by Thursday of Week 2 to schedule tutors.";
          } else {   
        //clean data
 //       Logger.log(rowData.studentName);

        rowData.day1 = spellDay(rowData.day1);
        rowData.day2 = spellDay(rowData.day2);
        rowData.time1 = extractTime(rowData.time1);
        rowData.time2 = extractTime(rowData.time2);
        rowData.studentName =firstNameFirst(rowData.studentName);
          }//ends if else clause
    
        // Generate a personalized email.
        // Given a template string, replace markers (for instance ${"First Name"}) with
        // the corresponding value in a row object (for instance rowData.firstName).
        var emailText = fillInTemplateFromObject(emailTemplate, rowData);
        var emailSubject = "Tutoring Schedule Change";
        Logger.log("I would have sent this email");
    //  MailApp.sendEmail(rowData.email, emailSubject, emailText);


    }else{
    Logger.log("Data was equal");
    };//ends else clause
 
  }//ends for loop 
          
  makeOldSchedule();
   
}//ends sendEmail function


 
 


// Replaces markers in a template string with values define in a JavaScript data object.
// Arguments:
//   - template: string containing markers, for instance ${"Column name"}
//   - data: JavaScript object with values to that will replace markers. For instance
//           data.columnName will replace marker ${"Column name"}
// Returns a string without markers. If no data is found to replace a marker, it is
// simply removed.
function fillInTemplateFromObject(template, data) {
  var email = template;
  // Search for all the variables to be replaced, for instance ${"Column name"}
  var templateVars = template.match(/\$\{\"[^\"]+\"\}/g);

  // Replace variables from the template with the actual values from the data object.
  // If no value is available, replace with the empty string.
  for (var i = 0; i < templateVars.length; ++i) {
  
    // normalizeHeader ignores ${"} so we can call it directly here.
    var variableData = data[normalizeHeader(templateVars[i])];
    

    email = email.replace(templateVars[i], variableData || "");
  }

  return email;
}






//////////////////////////////////////////////////////////////////////////////////////////
//
// The code below is reused from the 'Reading Spreadsheet data using JavaScript Objects'
// tutorial.
//
//////////////////////////////////////////////////////////////////////////////////////////

// getRowsData iterates row by row in the input range and returns an array of objects.
// Each object contains all the data for a given row, indexed by its normalized column name.
// Arguments:
//   - sheet: the sheet object that contains the data to be processed
//   - range: the exact range of cells where the data is stored
//   - columnHeadersRowIndex: specifies the row number where the column names are stored.
//       This argument is optional and it defaults to the row immediately above range; 
// Returns an Array of objects.
function getRowsData(sheet, range, columnHeadersRowIndex) {
  columnHeadersRowIndex = columnHeadersRowIndex || range.getRowIndex() - 1;
  var numColumns = range.getEndColumn() - range.getColumn() + 1;
  //Logger.log(numColumns);
  var headersRange = sheet.getRange(1,1,1,12);
  var headers = headersRange.getValues()[0];
  return getObjects(range.getValues(), normalizeHeaders(headers));
}

// For every row of data in data, generates an object that contains the data. Names of
// object fields are defined in keys.
// Arguments:
//   - data: JavaScript 2d array
//   - keys: Array of Strings that define the property names for the objects to create
function getObjects(data, keys) {
  var objects = [];
  for (var i = 0; i < data.length; ++i) {
    var object = {};
    var hasData = false;
    for (var j = 0; j < data[i].length; ++j) {
      var cellData = data[i][j];
      if (isCellEmpty(cellData)) {
        continue;
      }
      object[keys[j]] = cellData;
      hasData = true;
    }
    if (hasData) {
      objects.push(object);
    }
  }
  return objects;
}

// Returns an Array of normalized Strings.
// Arguments:
//   - headers: Array of Strings to normalize
function normalizeHeaders(headers) {
  var keys = [];
  for (var i = 0; i < headers.length; ++i) {
    var key = normalizeHeader(headers[i]);
    if (key.length > 0) {
      keys.push(key);
    }
  }
  return keys;
}

// Normalizes a string, by removing all alphanumeric characters and using mixed case
// to separate words. The output will always start with a lower case letter.
// This function is designed to produce JavaScript object property names.
// Arguments:
//   - header: string to normalize
// Examples:
//   "First Name" -> "firstName"
//   "Market Cap (millions) -> "marketCapMillions
//   "1 number at the beginning is ignored" -> "numberAtTheBeginningIsIgnored"
function normalizeHeader(header) {
  var key = "";
  var upperCase = false;
  for (var i = 0; i < header.length; ++i) {
    var letter = header[i];
    if (letter == " " && key.length > 0) {
      upperCase = true;
      continue;
    }
    if (!isAlnum(letter)) {
      continue;
    }
    if (key.length == 0 && isDigit(letter)) {
      continue; // first character must be a letter
    }
    if (upperCase) {
      upperCase = false;
      key += letter.toUpperCase();
    } else {
      key += letter.toLowerCase();
    }
  }
  return key;
}

// Returns true if the cell where cellData was read from is empty.
// Arguments:
//   - cellData: string
function isCellEmpty(cellData) {
  return typeof(cellData) == "string" && cellData == "";
}

// Returns true if the character char is alphabetical, false otherwise.
function isAlnum(char) {
  return char >= 'A' && char <= 'Z' ||
    char >= 'a' && char <= 'z' ||
    isDigit(char);
}

// Returns true if the character char is a digit, false otherwise.
function isDigit(char) {
  return char >= '0' && char <= '9';
}


//Function reverses the order of the names so that the first name appears first.
function firstNameFirst(studentName){

  studentName = studentName.split(",").reverse().toString().replace(",", " "); 
  
  return studentName;
};




//spells out days of the week.      
function spellDay(day) {
  switch (day) {

    case "M":
      day = "Monday";
      break;
    case "T":
      day = "Tuesday";
      break;
    case "W":
      day = "Wednesday";
      break;
    case "R":
      day = "Thursday";
      break;
    case "MW":
      day = "Monday and Wednesday";
      break;
    case "TR":
      day = "Tuesday and Thursday";
      break;

  }
  return day;
};




//function extracts time  
function extractTime(time) {
  
  var hour = time.getHours();
//  hour = hour - 3;
  var minute = time.getMinutes();
  if (minute === 0) {
    minute = minute.toString();
    minute = minute.concat("0pm");
  } else {
    minute = minute.toString();
    minute = minute.concat("am");
  }

  time = hour.toString().concat(":").concat(minute);

  return time;
};








