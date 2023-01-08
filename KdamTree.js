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
    for (var i = new Date().getFullYear(); i >= 2017 ; i--)
    {
        var a = await fetch("https://cheesefork.cf/courses/courses_"+i+"03.min.js");
        var b = await a.text();
        var text = 'מספר מקצוע":"' + courseNum;
        if (b.indexOf(text) > -1)
        {
            years += i.toString() + " ";
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
    var link = "https://michael-maltsev.github.io/technion-histograms/" + courseNum + "/index.min.json";
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
            if (preCourse)
            {
                var kdamkdam = getPreCourses(preCourse);
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

function getNextCourses(courseName)
{
    var text = "";
    var nextCOursesArr = getNextCoursesArr(courseName);
    for (var nextCourse of nextCOursesArr)
    {
        var kdamkdam = getNextCourses(nextCourse.general["מספר מקצוע"]);
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

async function showMalagimAndEnglish(e)
{
    var mode = e.srcElement.id
    var otherOption = mode == "malagim" ? "english" : "malagim";
    var text = "";
    if (e.srcElement.checked)
    {
        if (document.getElementById(otherOption).checked)
            mode = "both";
        document.getElementById("course").disabled = true;
        
        var courseNums = "";
        var englishCourses = "014603 046200 036013 038746 036026 036073 036004 056391 056403 056149 066614 084515 085407 085915 085802 085805 086484 086762 86802 088792 094195 094396 096617 104182 104122 106433 106723 196014 197010 114229 114252 114250 114251 136022 136014 136037 205028 236716 236299 236330 236509 236781 236025 236606 336016 324282 326000 326002 326005 326006"; //spring 2022
        //var englishCourses = "014942 014325 014301 014305 016302 046746 036003 036005 036015 036020 036055 036070 036086 036090 036073 036067 036081 056146 056396 056394 056386 084213 086289 086320 086380 086520 086761 086923 094189 094195 104183 104222 106380 106941 196012 114229 114252 114250 114251 136042 205923 207041 127437 128719 127738 336546 236605 236719 236201 236609 236378 236833 324282 326004"; //winter 2022
        //var malagim = "214120 324262 324266 324267 324269 324273 324274 324279 324282 324283 324284 324292 324293 324295 324297 324305 324306 324307 324310 324430 324432 324442 324444 324445 324453 324456 324457 324462 324520 324521 324527 324528 324539 324540 324946 324962 324992 325001 326004"; //winter 2022
        var malagim = "214119 214120 324265 324267 324269 324273 324274 324258 324282 324284 324286 324292 324294 324297 324307 324314 324424 324433 324439 324441 324442 324445 324446 324527 324528 324541 324975 324992 325006 326000 326001 326002 326005 326006"; //spring 2022
        if (mode == "malagim")
            courseNums = malagim
        else if (mode == "english")
            courseNums = englishCourses
        else //both
        {
            var temp = ""
            var englishCoursesArr = englishCourses.split(" ");
            for (var englishCourse of englishCoursesArr)
                if (malagim.indexOf(englishCourse) > -1)
                    temp += englishCourse + " "
            courseNums = temp.trimEnd();
        }

        addCustom(courseNums);
        return;

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

                //elem.innerHTML += "<ul class='nested' style=\"margin-top:0px\">";
                //elem.innerHTML += getPreCourses(getCourse(courseNum));
                //elem.innerHTML += "</ul>";
                
                //text += "<li><span class=\"box\">";
                //text += formatNumberAndName(course).replace(course.general["מספר מקצוע"],"<a href='https://students.technion.ac.il/local/technionsearch/course/" +  course.general["מספר מקצוע"] + "' target='_blank'>" + course.general["מספר מקצוע"] + "</a>" );
                //text += "<span value='" + course.general['מספר מקצוע'] + "' name='avg'></span>";
                //text += "</span>";
                //elems.push(course);
                //text += "</li>";
                //getAverage("https://aviaavraham.github.io/KdamTree/course_avg/"+courseNum + ".txt",elem);
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
    else
    {
        if (document.getElementById(otherOption).checked)
        {
            document.getElementById(otherOption).dispatchEvent(new Event("change"));
        }
        else
        {
            updateTree();
            document.getElementById("course").disabled = false;
        }
    }
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
    //var englishCourses = "014942 014325 014301 014305 016302 046746 036003 036005 036015 036020 036055 036070 036086 036090 036073 036067 036081 056146 056396 056394 056386 084213 086289 086320 086380 086520 086761 086923 094189 094195 104183 104222 106380 106941 196012 114229 114252 114250 114251 136042 205923 207041 127437 128719 127738 336546 236605 236719 236201 236609 236378 236833 324282 326004";
    //var malagim = "214120 324262 324266 324267 324269 324273 324274 324279 324282 324283 324284 324292 324293 324295 324297 324305 324306 324307 324310 324430 324432 324442 324444 324445 324453 324456 324457 324462 324520 324521 324527 324528 324539 324540 324946 324962 324992 325001 326004";
    var arr = [];
    if (document.querySelector("#malagim").checked && document.querySelector("#english").checked)
        arr = getMutual(englishCourses.split(" "),malagim.split(" "))
    else if (document.querySelector("#malagim").checked)
        arr = arr.concat(malagim.split(" "));
    else if (document.querySelector("#english").checked)
        arr = arr.concat(englishCourses.split(" "));
    
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
    //console.log(arr);
    if (count)
    {
        document.querySelector("#course").disabled = true;
        addCustom(arr.toString().replaceAll(","," "));

    }
    else
    {
        document.querySelector("#course").disabled = false;
        updateTree();
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


const coursesFromRishumLatest = courses_from_rishum;
// event listeners setup

document.getElementById("course").addEventListener("keyup", updateTree);
document.getElementById("treeMode").addEventListener("change", updateTree);

updateBoxesEventListners();

document.getElementById("showKdamim").addEventListener("mouseover",
function() 
{
    document.querySelector("#kdamim").classList.remove("nested");
});
/*
document.querySelector("#listName").addEventListener("keyup",function(){
    document.querySelector("#saveList").disabled = document.querySelector("#listName").value == "" || document.querySelector("#coursesToAdd").value == "";
});

document.querySelector("#coursesToAdd").addEventListener("keyup",function(){
    document.querySelector("#saveList").disabled = document.querySelector("#listName").value == "" || document.querySelector("#coursesToAdd").value == "";
}); */

document.getElementById("showKdamim").addEventListener("mouseout",
function() 
{
    document.querySelector("#kdamim").classList.add("nested");
});
/*
document.getElementById("addList").addEventListener("click",
function()
{
    document.querySelector("#addListWindow").classList.toggle("nested");
    document.querySelector("#saveList").disabled = document.querySelector("#listName").value == ""; 
});
document.getElementById("saveList").addEventListener("click",
function()
{
    var arr = document.querySelector("#coursesToAdd").value.split(/\n| |-/);
    var courseNums = "";
    for (var t of arr)
    {
        var val = parseInt(t).toString();
        if (val.length == 5)
        {
            val = "0" + val;
        }
        if (val && val != "NaN")
        {
            //console.log(val)
            var course = getCourse(val);
            if (course)
            {
                if (courseNums.indexOf(val) == -1)
                    courseNums += val + " ";
                console.log(formatNumberAndName(course));
            }
        }
    }
    var namesList = getCookie("names");
    var newListName = document.querySelector("#listName").value.replaceAll(",","");
    var cookieVal = namesList ? namesList + ","  + newListName : newListName;
    if (namesList.split(",").indexOf(newListName) > -1)
    {
        if(!confirm("קיימת כבר רשימה בשם זה, האם ברצונך לעדכן אותה?"))
            return;
        cookieVal = namesList; //not empty and in there, so don't change
    }
    else 
        addCheckBox(newListName,courseNums);
    
    document.querySelector("#addListWindow").classList.toggle("nested");
    setCookie("names",cookieVal ,365*5);
    setCookie(newListName,courseNums,365*5);
});
*/
/*
document.getElementById("beta").addEventListener("change", 
function()
{
    var modeOn = this.checked;
    //update cookies and read them onload
    var elems = document.getElementsByClassName("betaFeature");
    for (var elem of elems)
    {
        elem.classList.toggle("nested");
    }
});
*/

var englishCourses = "014603 046200 036013 038746 036026 036073 036004 056391 056403 056149 066614 084515 085407 085915 085802 085805 086484 086762 86802 088792 094195 094396 096617 104182 104122 106433 106723 196014 197010 114229 114252 114250 114251 136022 136014 136037 205028 236716 236299 236330 236509 236781 236025 236606 336016 324282 326000 326002 326005 326006"; //spring 2022
//var englishCourses = "014942 014325 014301 014305 016302 046746 036003 036005 036015 036020 036055 036070 036086 036090 036073 036067 036081 056146 056396 056394 056386 084213 086289 086320 086380 086520 086761 086923 094189 094195 104183 104222 106380 106941 196012 114229 114252 114250 114251 136042 205923 207041 127437 128719 127738 336546 236605 236719 236201 236609 236378 236833 324282 326004"; //winter 2022
//var malagim = "214120 324262 324266 324267 324269 324273 324274 324279 324282 324283 324284 324292 324293 324295 324297 324305 324306 324307 324310 324430 324432 324442 324444 324445 324453 324456 324457 324462 324520 324521 324527 324528 324539 324540 324946 324962 324992 325001 326004"; //winter 2022
var malagim = "214119 214120 324265 324267 324269 324273 324274 324258 324282 324284 324286 324292 324294 324297 324307 324314 324424 324433 324439 324441 324442 324445 324446 324527 324528 324541 324975 324992 325006 326000 326001 326002 326005 326006"; //spring 2022


document.getElementById("malagim").addEventListener("change", showAllSelected);
document.getElementById("english").addEventListener("change", showAllSelected);

//load defaults
document.getElementById("course").value = "234114 - מבוא למדעי המחשב מ'";
updateTree();


var cookiesNames = getCookie("names").split(",");
for (var cookie of cookiesNames){
    if (cookie)
        addCheckBox(cookie,getCookie(cookie));
}