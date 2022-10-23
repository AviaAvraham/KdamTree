function updateTree() 
{
    var textbox = document.getElementById("course");
    textbox.value = textbox.value.replaceAll(" ","");
    var courseName = textbox.value;
    
    var course = getCourse(courseName);
    if (course) 
    {
        document.getElementById("courseName").innerHTML = "<br>" + course.general["שם מקצוע"] + "<br>";
        if (document.querySelector("#treeMode").checked)
        {
            //normal mode
        }
        else
        {
            //kdamim tree mode
        }
        var kdamNames = processNames(course.general["מקצועות קדם"]);
        if (kdamNames) 
        {
            document.getElementById("disp").innerHTML = kdamNames;
        } 
        else 
        {
            document.getElementById("disp").innerHTML = "לקורס זה אין קדמים!";
        }

        var nextCourses = getNextCourses(courseName);
        if (nextCourses)
        {
            document.getElementById("kdamTo").innerHTML = nextCourses;
        }
        else
        {
            document.getElementById("kdamTo").innerHTML = "קורס זה אינו קדם לאף קורס אחר";
        }

        var avgPlaces = document.getElementsByName("avg");
        for (elem of avgPlaces)
        {
            var courseNum = elem.id; //is a string
            getAverage("\\course_avg\\" + courseNum + ".txt" ,courseNum);
        }
        updateBoxesEventListners();
    } 
}


async function getAverage(link,num) {
    try 
    {
        let myObject = await fetch(link);
        if ((myObject.status === 200))
        {
        let myText = await myObject.json();
        let avg = getAverageFromObject(myText);
        if (!avg.isNaN)
            document.getElementById(num).innerHTML = "- ממוצע - " + avg;
        else    
            document.getElementById(num).innerHTML = " - אין ממוצע";
        }
        
        else
        {
            document.getElementById(num).innerHTML = " - אין ממוצע";
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
            format = "(לא מועבר בסמסטר)";
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
    for (var isKdam of courses_from_rishum)
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
        text += "<span id='" + nextCourse.general['מספר מקצוע'] + "' name='avg'></span>";
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



    for (var isKdam of courses_from_rishum)
    {
        if (isKdam.general["מקצועות קדם"]!= undefined && isKdam.general["מקצועות קדם"].indexOf(courseName) > -1)
        {
            var kdamkdam = getNextCourses(isKdam.general["מספר מקצוע"]);
            if (kdamkdam == "") 
            {
                text += "<li><span class=\"box\">";
            }
            else
            {
                text += "<li><span class=\"box arrow\">";
            }
            text += formatNumberAndName(isKdam).replace(isKdam.general["מספר מקצוע"],"<a href='https://students.technion.ac.il/local/technionsearch/course/" +  isKdam.general["מספר מקצוע"] + "' target='_blank'>" + isKdam.general["מספר מקצוע"] + "</a>" );
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
    return text;
}

function getAverageFromObject(data)
{
    //to be automated
    var count = 0;
    var gradesSUm = 0, studentsSum = 0;
    for (var i = 0; i < 7 && count < 3 ; i++)
    {
        for (var j = 3; j > 0 && count < 3; j--)
        {
            var year = new Date().getFullYear().toString() - i;
            var semester = year + "0"+ j
            if (data[semester] == undefined) //not in db
                continue;
            //console.log(data[semester]);
            var students = parseInt(data[semester].Finals.students);
            studentsSum += students;
            gradesSUm += students * parseInt(data[semester].Finals.average);
            count++;
        }
    }
    return gradesSUm/studentsSum;
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
    for (var course of courses_from_rishum) 
        if (course.general["מספר מקצוע"] == number) 
            return course;

    return null;
}

function toggleList()
{
    this.parentElement.querySelector(".nested").classList.toggle("active");
    this.classList.toggle("check-box");
}

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

//load defaults
document.getElementById("course").value = 234114;
updateTree();
