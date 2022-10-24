function updateTree() 
{
    var textbox = document.getElementById("course");
    textbox.value = textbox.value.replaceAll(" ","");
    var courseName = textbox.value;
    
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
        document.getElementById("courseName").innerHTML = "<br>" + course.general["שם מקצוע"] + "<br>";

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
    } 
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

function putColorByValue(elems)
{
    for (var elem of elems)
    {
        var courseNum = elem.getAttribute("value"); //is a string
        if (isVisible(elem))
            getAverage("https://aviaavraham.github.io/KdamTree/course_avg/"+courseNum + ".txt",elem);
    }
}

function isVisible(elem)
{
    return !!( elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length );
}

function getColor(n) {
    var v = (n - 50) * (120/50);;
    v = v < 0 ? 0 : v;
    return 'hsl(' + v + ',100%,50%)';
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
                    element.innerHTML = "- ממוצע - " + avg.toFixed(2);
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
    var gradesSUm = 0, studentsSum = 0;
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
    var newElems = this.parentElement.querySelectorAll('[name="avg"]') ; //with parent
    putColorByValue(newElems);
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
