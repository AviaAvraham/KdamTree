function updateTree() 
{
    var textbox = document.getElementById("course");
    textbox.value = textbox.value.replaceAll(" ","");
    var courseName = textbox.value;
    
    var course = getCourse(courseName);
    if (course) 
    {
        document.getElementById("courseName").innerHTML = "<br>" + course.general["שם מקצוע"] + "<br>";
        var kdamNames = processNames(course.general["מקצועות קדם"]);
        if (kdamNames) 
        {
            document.getElementById("disp").innerHTML = kdamNames;
        } 
        else 
        {
            document.getElementById("disp").innerHTML = "לקורס זה אין קדמים!";
        }

        var text = getKdamimOfCourse(courseName);
        if (text)
        {
            document.getElementById("kdamTo").innerHTML = text;
        }
        else
        {
            document.getElementById("kdamTo").innerHTML = "קורס זה אינו קדם לאף קורס אחר";
        }
        updateBoxesEventListners();
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

function getKdamimOfCourse(courseName)
{
    var text = "";
    for (var isKdam of courses_from_rishum)
    {
        if (isKdam.general["מקצועות קדם"]!= undefined && isKdam.general["מקצועות קדם"].indexOf(courseName) > -1)
        {
            var kdamkdam = getKdamimOfCourse(isKdam.general["מספר מקצוע"]);
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
