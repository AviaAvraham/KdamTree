function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function updateTree() 
{
    var textbox = document.getElementById("course");
    //console.log(textbox.value);
    //textbox.value = textbox.value.replaceAll(" ","");
    var courseName = document.getElementById("course").value.split(" ")[0];
    
    var course = getCourse(courseName);
    if (course) 
    {
        var kdamNames = processNames(course.general["מקצועות קדם"]);
        if (kdamNames) 
        {
            document.getElementById("disp").innerHTML = kdamNames;
        } 
        else 
        {
            document.getElementById("disp").innerHTML = "לקורס זה אין קדמים!";
        }
        document.getElementById("courseName").innerHTML = course.general["שם מקצוע"] + "<br>";

        if (document.querySelector("#treeMode").checked)
        {
            //normal mode
            document.getElementById("kdamim").style = "";
            loadNextCourses(course);
        }
        else
        {
            //kdamim mode
            document.getElementById("kdamim").style = "display:inline-block"
            var text = getPreCourses(course);
            document.getElementById("kdamTo").innerHTML = text ? text : "";            
        }

        var avgPlaces = document.getElementsByName("avg");
        putColorByValue(avgPlaces);
        updateBoxesEventListners();

        getSummerData(courseName);
    } 
}


async function getSummerData(courseNum)
{
    //document.getElementById("summerStatistics").innerText = "";
    var sum = 0, count = 0;
    var years = "";
    for (var i = new Date().getFullYear(); i > 2017 ; i--)
    {
        var summer_url;
        var real_course_num = courseNum;
        if (i > 2023)
        {
            // because of SAP system, links have a new format
            // just an estimation for now based on winter and spring... hasn't happened yet
            summer_url = `https://sap.cheesefork.cf/courses_${i}_202.min.js`; 
        }
        else
        {
            // old, ug system link
            summer_url = `https://ug.cheesefork.cf/courses_${i-1}03.min.js` // i-1 due to offset in urls, summer of 2023 is 202203
            real_course_num = courseNum.split('').filter((_, index) => index !== 0 && index !== 4).join(''); // Remove indices 0 and 4
        }
        var summer_response = await fetch(summer_url);
        var summer_data = await summer_response.text();
        var text = 'מספר מקצוע":"' + real_course_num;
        if (summer_data.indexOf(text) > -1)
        {
            years += (i+1).toString() + " ";
            count++;
            //document.getElementById("summerStatistics").innerText = true;
        }
        else
        {
            //document.getElementById("summerStatistics").innerText = false;
        }
    }
    var currYear = (new Date().getFullYear()) - 2017 + -1 + (new Date().getMonth() > 7);
    var text;
    if (years != "")
        text = "ב-" + currYear + " השנים האחרונות, הקורס הועבר בקיץ " + count + " פעמים (" + years.trim().replaceAll(" "," ,") + ")";
    else
        text = "הקורס לא הועבר בקיץ ב-" + currYear + " השנים האחרונות";
    //document.getElementById("summerStatistics").innerText = text;
    text += "<br>";
    var shortedCourseNum = courseNum.split('').filter((_, index) => index !== 0 && index !== 4).join(''); // Remove indices 0 and 4
    console.log(shortedCourseNum)
    var link = "https://michael-maltsev.github.io/technion-histograms/" + shortedCourseNum + "/index.min.json";
    let myObject = await fetch(link);
    if ((myObject.status === 200))
    {
        let myText = await myObject.json();
        let avg = getAverageFromObject(myText);
        if (!isNaN(avg))
        {
            text += "<b>"
            text += "ממוצע - " + avg.toFixed(2);
            text += "</b>"
        }
        else    
            text += "אין ממוצע זמין עבור קורס זה";
    }
    else
    {
        text += "אין ממוצע זמין עבור קורס זה";
    }
    document.getElementById("summerStatistics").innerHTML = text;
    //document.getElementById("summerStatistics").innerText = text;
}

var recursionDepthPreCourses = 0;
function getPreCourses(course)
{
    var kdamim = course.general["מקצועות קדם"];
    var text = "";
    if (kdamim !== undefined)
    {
        var numsFromStr = kdamim.replaceAll("(","").replaceAll(")","").replaceAll("או","").replaceAll("ו","").replaceAll("-","");
        var arr = numsFromStr.split(' ').filter(i => i); //removes spaces
        arr = Array.from(new Set(arr)); //removes dupelicates
        for (var preCourseNum of arr)
        {
            var preCourse = getCourse(preCourseNum);
            //console.log(preCourseNum);
            if (preCourse && recursionDepthPreCourses <= 10)
            {
                recursionDepthPreCourses+=1;
                var kdamkdam = getPreCourses(preCourse);
                recursionDepthPreCourses -=1;
                if (kdamkdam == "") 
                {
                    text += "<li><span class=\"box\">";
                }
                else
                {
                    text += "<li><span class=\"box arrow\">";
                }
                text += formatNumberAndName(preCourse).replace(preCourse.general["מספר מקצוע"],"<a href='https://students.technion.ac.il/local/technionsearch/course/" +  preCourse.general["מספר מקצוע"] + "' target='_blank'>" + preCourse.general["מספר מקצוע"] + "</a>" );
                text += "<span value='" + preCourse.general['מספר מקצוע'] + "' name='avg'></span>";
                text += "</span>";
                if (kdamkdam != "")
                {  
                    text += "<ul class='nested' style=\"margin-top:0px\">";
                    text += kdamkdam;
                    text += "</ul>";
                }
                text += "</li>";
            }
        }
    }
    return text;
}

function loadNextCourses(course)
{
    var nextCourses = getNextCourses(course.general["מספר מקצוע"]);
    if (nextCourses)
    {
        document.getElementById("kdamTo").innerHTML = nextCourses;
    }
    else
    {
        document.getElementById("kdamTo").innerHTML = "קורס זה אינו קדם לאף קורס אחר";
    }
}

async function putColorByValue(elems)
{
    const promises = []
    for (var elem of elems)
    {
        var courseNum = elem.getAttribute("value"); //is a string
        var shortenedCourseNum = courseNum.split('').filter((_, index) => index !== 0 && index !== 4).join(''); // Remove indices 0 and 4
        //console.log(courseNum + "-> " +shortenedCourseNum)
        if (isVisible(elem))
            promises.push(getAverage("https://michael-maltsev.github.io/technion-histograms/" + courseNum + "/index.min.json",elem));
            //promises.push(getAverage("https://aviaavraham.github.io/KdamTree/course_avg/"+courseNum + ".txt",elem));
    }
    return Promise.all(promises);
}

function isVisible(elem)
{
    return !(elem.parentElement.parentElement.parentElement.classList.contains("nested") && !elem.parentElement.parentElement.parentElement.classList.contains("active"));
    //return !!( elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length );
}

function getColor(n) {
    var v = (n - 50) * (140/50) - 2000/n;
    v = v < 0 ? 0 : v;
    return 'hsl(' + v + ',100%,73%)';
}

async function getAverage(link,element) {
    try 
    {
        let myObject = await fetch(link);
        if ((myObject.status === 200))
        {
            let myText = await myObject.json();
            let avg = getAverageFromObject(myText);
            if (!isNaN(avg))
                {
                    element.innerHTML = " - ממוצע - " + avg.toFixed(2);
                    element.parentElement.style.background = getColor(avg);
                }
            else    
                element.innerHTML = " - אין ממוצע";
        }
        else
        {
            element.innerHTML = " - אין ממוצע";
        }
    }
    catch (e)
    {
    } 
}
  
function processNames(str)
{
    if (str == undefined) //no kdamim
        return "";
    var numsFromStr = str.replaceAll("(","").replaceAll(")","").replaceAll("או","").replaceAll("ו","").replaceAll("-","");
    var arr = numsFromStr.split(' ').filter(i => i); //removes spaces
    arr = Array.from(new Set(arr)); //removes dupelicates
    for (var num of arr)
    {
        var course = getCourse(num);
        var format;
        if (course == null) //not in list
        {
            continue; 
            //format = "(לא מועבר בסמסטר)";
        }
        else 
        {
            format = formatNumberAndName(course);
        }
        //https://www.w3schools.com/css/css_tooltip.asp
        format = "<div class='tooltip'><span class='tooltiptext'>" + format + "</span>" + num + "</div>";
        str = str.replaceAll(num,format);
    }
    return str;    
}

function getNextCoursesArr(courseName)
{
    var arr = [];
    for (var isKdam of coursesFromRishumLatest)
    {
        if (isKdam.general["מקצועות קדם"]!= undefined && isKdam.general["מקצועות קדם"].indexOf(courseName) > -1)
        {
            arr.push(isKdam);
        }
    }
    return arr;
}

var recursionDepthNextCourses = 0;
function getNextCourses(courseName)
{
    var text = "";
    var nextCOursesArr = getNextCoursesArr(courseName);
    for (var nextCourse of nextCOursesArr)
    {
        if (recursionDepthNextCourses <= 10)
        {
            recursionDepthNextCourses+=1; //think of keeping list of nexts or smth
            var kdamkdam = getNextCourses(nextCourse.general["מספר מקצוע"]);
            recursionDepthNextCourses-=1;
        }
        if (kdamkdam == "") 
        {
            text += "<li><span class=\"box\">";
        }
        else
        {
            text += "<li><span class=\"box arrow\">";
        }
        text += formatNumberAndName(nextCourse).replace(nextCourse.general["מספר מקצוע"],"<a href='https://students.technion.ac.il/local/technionsearch/course/" +  nextCourse.general["מספר מקצוע"] + "' target='_blank'>" + nextCourse.general["מספר מקצוע"] + "</a>" );
        text += "<span value='" + nextCourse.general['מספר מקצוע'] + "' name='avg'></span>";
        text += "</span>";
        if (kdamkdam != "")
        {  
            text += "<ul class='nested' style=\"margin-top:0px\">";
            text += kdamkdam;
            text += "</ul>";
        }
        text += "</li>";
    }
    return text;
}

function getAverageFromObject(data)
{
    var count = 0;
    var gradesSum = 0, studentsSum = 0;
    for (var i = 0; i < 7 && count < 3 ; i++)
    {
        for (var j = 3; j > 0 && count < 3; j--)
        {
            var year = new Date().getFullYear().toString() - i;
            var semester = year + "0"+ j
            if (data[semester] == undefined || data[semester].Finals == undefined) //not in db
                continue;
            var students = parseInt(data[semester].Finals.students);
            studentsSum += students;
            gradesSum += students * parseInt(data[semester].Finals.average);
            count++;
        }
    }
    return gradesSum/studentsSum;
}

function updateBoxesEventListners()
{
    var toggler = document.getElementsByClassName("arrow");
    for (var i = 0; i < toggler.length; i++) 
    {
        toggler[i].addEventListener("click", toggleList);
    }
}

function formatNumberAndName(course)
{
    var text = "";
    text += course.general["מספר מקצוע"];
    text += " - ";
    text += course.general["שם מקצוע"];
    return text;
}

function getCourse(number) 
{
    for (var course of coursesFromRishumLatest) 
        if (course.general["מספר מקצוע"] == number) 
            return course;

    return null;
}

function toggleList()
{
    this.parentElement.querySelector(".nested").classList.toggle("active");
    this.classList.toggle("check-box");
    var newElems = this.parentElement.querySelectorAll('[name="avg"]') ; //with parent
    putColorByValue(newElems);
}

async function addCustom(courseNums)
{
    var elems = [];
    var courseNumsArr = courseNums.split(" ");
    document.getElementById("kdamTo").innerHTML = "";

    for (var courseNum of courseNumsArr)
    {
        var course = getCourse(courseNum);
        if (course)
        {
            var elem = document.createElement("li");
            var span = document.createElement("span");
            span.classList.add("box");
            elem.appendChild(span);

            var link = document.createElement("a");
            link.target = "_blank"
            link.href =  "https://students.technion.ac.il/local/technionsearch/course/" +  course.general["מספר מקצוע"];
            link.innerText = course.general["מספר מקצוע"];
            span.appendChild(link);
            span.innerHTML += " - ";
            span.innerHTML += course.general["שם מקצוע"];

            var avgPlaceHolder = document.createElement("span");
            avgPlaceHolder.setAttribute("value",courseNum);
            avgPlaceHolder.setAttribute("Name", "avg");
            span.appendChild(avgPlaceHolder);
            elems.push(elem);
            document.getElementById("kdamTo").appendChild(elem);

            var ul = document.createElement("ul")
            ul.classList.add("nested");
            ul.style = "margin-top:0px;";
            var req = getPreCourses(getCourse(courseNum));
            if (req)
                span.classList.add("arrow")
            ul.innerHTML = req;

            elem.appendChild(ul);
        }
    }

    updateBoxesEventListners();

    let avgPlaces = Array.from(document.getElementsByName("avg"));
    avgPlaces = avgPlaces.filter(i => isVisible(i));
    
    putColorByValue(avgPlaces).then( function() {   
        var grades = [];
        for (var i = 0 ; i < avgPlaces.length; i++)
        {
            if (avgPlaces[i].innerHTML.indexOf("אין ממוצע") < 0)
            {
                grades.push(parseFloat(avgPlaces[i].innerHTML.replace("- ממוצע - ","")))
            }
            else
                grades.push(0);
        }
        grades.sort((a,b)=>b-a);
        var index = 0;
        var sortedElems = [];
        while ( 0 != avgPlaces.length)
        {
            var max = grades[index];
            if (max == 0)
            {
                sortedElems.push(avgPlaces.pop().parentElement.parentElement)
                index++;
            }
            else 
            {
                for (var i = 0 ; i < avgPlaces.length; i++)
                {
                    if (parseFloat(avgPlaces[i].innerHTML.replace("- ממוצע - ","")) == max)
                    {
                        sortedElems.push(avgPlaces[i].parentElement.parentElement);
                        //document.getElementById("kdamTo").appendChild(avgPlaces[i].parentElement.parentElement);
                        avgPlaces.splice(i,1);
                        index++;
                        break;
                    }
                }
            }
        }
        for (var elem of sortedElems)
            document.getElementById("kdamTo").appendChild(elem);
    })//.catch(console.log("error"));
}

function getMutual(arr1, arr2)
{
    return arr1.filter(function(n) {
        return arr2.indexOf(n) !== -1;
    });
}

function showAllSelected()
{
    var count = document.querySelector("#malagim").checked + document.querySelector("#english").checked;
    var names = getCookie("names").split(",");
    var arr = [];
    if (document.querySelector("#malagim").checked && document.querySelector("#english").checked)
        arr = getMutual(englishCourses,malagim)
    else if (document.querySelector("#malagim").checked)
        arr = arr.concat(malagim);
    else if (document.querySelector("#english").checked)
        arr = arr.concat(englishCourses);
    
    console.log(arr);
    var list = document.getElementsByName("customListCheckbox");
    for (var checkbox of list)
    {
        if (checkbox.checked)
        {
            var courseList = getCookie(checkbox.nextSibling.innerText);
            if (arr.length)
            {
                arr = getMutual(arr,courseList.split(" "));
            }
            else if (!count)
            {
                arr = courseList.split(" ");
            }
            count++;
        }
    }
    arr = [...new Set(arr)];
    console.log(arr);
    if (count)
    {
        document.querySelector("#course").disabled = true;
        addCustom(arr.toString().replaceAll(","," "));
        document.getElementById("summerStatistics").classList.add("nested");
    }
    else
    {
        document.querySelector("#course").disabled = false;
        updateTree();
        document.getElementById("summerStatistics").classList.remove("nested");
    }
}

function addCheckBox(listName,courseNums)
{
    var input = document.createElement("input");
    input.type = "checkbox";
    input.style = "float: right; margin-top: 5px;";
    input.setAttribute("name","customListCheckbox");
    //document.querySelector("#mainWindow").insertBefore(input,document.querySelector("#addList"));

    input.addEventListener("change",showAllSelected); // <================
    var div = document.createElement("div");
    div.style = "margin-right: 25px;";
    div.innerHTML = listName;
    

    var removeButton = document.createElement("input");
    removeButton.type = "button";
    removeButton.style = "background:none; border:none;cursor:pointer;left:60px;position: absolute;"
    removeButton.onclick = function () 
    { this.parentElement.previousSibling.remove();
        this.parentElement.remove();
        var cookieName = this.parentElement.innerText;
        setCookie(cookieName,courseNums,-1);
        var cookiesAsArr = getCookie("names").split(",");
        cookiesAsArr.splice(cookiesAsArr.indexOf(cookieName),1);
        setCookie("names",cookiesAsArr.toString() ,-1);
        /* delete cookies */};
    removeButton.value = "X";
    div.appendChild(removeButton);
    document.querySelector("#mainWindow").insertBefore(div,document.querySelector("#addList"));
}


var coursesFromRishumLatest = courses_from_rishum;
var currentSemester;
var previousSemester;
var winterAndSpring;
async function setupData()
{
    if (currentSemester == undefined || previousSemester == undefined || winterAndSpring == undefined)
    {
        // fetch latest course data
        var winter_response, spring_response;
        for (var i = new Date().getFullYear(); i >= 2017 ; i--)
        {
            var winter_url, spring_url;
            if (i > 2023)
            {
                // because of SAP system, links have a new format
                winter_url = `https://sap.cheesefork.cf/courses_${i}_200.min.js`
                spring_url = `https://sap.cheesefork.cf/courses_${i}_201.min.js`
            }
            else
            {
                // old, ug system links
                winter_url = `https://ug.cheesefork.cf/courses_${i}01.min.js`
                spring_url = `https://ug.cheesefork.cf/courses_${i}02.min.js`
            }

            var temp;
            if (!winter_response)
            {
                temp = await fetch(winter_url);
                if (temp.status === 200){
                    winter_response = temp;
                    console.log("now using " + i + " for winter")
                }
            }

            if (!spring_response)
            {
                temp = await fetch(spring_url);
                if (temp.status === 200){
                    spring_response = temp;
                    console.log("now using " + i + " for spring")
                }
            }

            if (winter_response && spring_response)
                break;
        }
        
        if (winter_response && winter_response.status === 200 && spring_response && spring_response.status === 200)
        {
            let firstRishum = await winter_response.text();
            firstRishum = firstRishum.replace("courses_from_rishum","list1");
            eval(firstRishum);
            previousSemester = list1;
            //console.log(previousSemester.length)
            let secondRishum = await spring_response.text();
            secondRishum = secondRishum.replace("courses_from_rishum","list2");
            eval(secondRishum);
            currentSemester = list2;
            //console.log(currentSemester.length);
            
            winterAndSpring = [];
            Object.assign(winterAndSpring,currentSemester); //to avoid modifying currentSemester
            for (course of previousSemester)
            {
                var add = true;
                for (courseNow of currentSemester)
                { 
                    if (course.general["מספר מקצוע"] == courseNow.general["מספר מקצוע"])
                        add = false;
                    
                }

                if (add)
                {
                    winterAndSpring.push(course);
                    //console.log(course.general["מספר מקצוע"]);
                }
            }
            
            var firstRadio = document.querySelector("#showSemester");
            var secondRadio = document.querySelector("#showAllYear");
            if (firstRadio.checked)
            {
                console.log("here!")
                coursesFromRishumLatest = currentSemester; 
                //setCookie("pref","current",365*5);
                //need to check what's current semester when automating
            }
            else 
            {
                console.log("showing all")
                //setCookie("pref","allYear",365*5);
                coursesFromRishumLatest = winterAndSpring;
            }
        }
    }

    updateAutoComplete();
    if (!firstSetup)
        updateTree();
    else
        firstSetup = false;
}
var firstSetup = true;
setupData();
// event listeners setup

document.getElementById("course").addEventListener("keyup", updateTree);
document.getElementById("treeMode").addEventListener("change", updateTree);

updateBoxesEventListners();

document.getElementById("showKdamim").addEventListener("mouseover",
function() 
{
    document.querySelector("#kdamim").classList.remove("nested");
});


document.getElementById("showKdamim").addEventListener("mouseout",
function() 
{
    document.querySelector("#kdamim").classList.add("nested");
});

document.getElementById("showAllYear").addEventListener("change", setupData);
document.getElementById("showSemester").addEventListener("change", setupData);


const convert_format = (str) => {
    if (str.length === 6) {
      return `00${str.slice(0, 3)}${str.slice(3)}`;
    } else if (str.length === 7) {
      return `0${str}`;
    }
    return str;
}

// default values, old
var englishCourses = "014143 014733 016339 016210 046211 046746 036005 036012 036049 036099 036088 036064 036032 036087 036026 056146 056386 056396 056394 084213 086730 086366 086520 086761 086923 094189 094195 104222 114229 114252 114250 114251 136042 127437 127741 127010 206808 205923 236201 236609 236833 236816 236901 236719 236205 274252 336546 338002 315014 315200 315242".split(" ").map(convert_format);
var malagim = "207953 214120 324262 324267 324269 324274 324279 324282 324283 324284 324292 324293 324307 324314 324432 324439 324442 324445 324518 324521 324527 324528 324992 324946 326001 326004 326005 326008".split(" ").map(convert_format); //winter 2023

// the following updates daily, should show the most recent courses
const fetch_english_and_malag_url = 'https://aviaavraham.com/eng-and-malag/output.json';

async function fetch_english_and_malag() {
    try {
        const response = await fetch(fetch_english_and_malag_url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.courses != "")
            englishCourses = data.courses.map(convert_format)
        else
            englishCourses = englishCourses;

        if (data.malagim != "")
            malagim = data.malagim.map(convert_format);
        else
            malagim = malagim;

        // Log the variables to the console
        console.log(data)
        console.log('Courses:', data.courses);
        console.log('Malagim:', data.malagim);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

fetch_english_and_malag();



document.getElementById("malagim").addEventListener("change", showAllSelected);
document.getElementById("english").addEventListener("change", showAllSelected);

//load defaults
document.getElementById("course").value = "02340114 - מבוא למדעי המחשב מ'";
updateTree();


var cookiesNames = getCookie("names").split(",");
for (var cookie of cookiesNames){
    if (cookie)
        addCheckBox(cookie,getCookie(cookie));
}