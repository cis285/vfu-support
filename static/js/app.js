function setTheme(name)
{
    localStorage.setItem('theme', name);
}

function toggleTheme()
{
    if (localStorage.getItem('theme') === 'theme-default')
    {
        setTheme('theme-dark');
        createStylesheetElement('/static/css/theme-dark.css');
        
        document.getElementById('themeToggle').checked = true;
    }
    else
    {
        setTheme('theme-default');
        document.head.children[document.head.children.length - 1].outerHTML = "";
        
        document.getElementById('themeToggle').checked = false;
    }
}

function createStylesheetElement(href)
{
    for (var i = 0; i < document.styleSheets.length; i++)
    {
        if (document.styleSheets[i].href && 
            document.styleSheets[i].href.indexOf(href) > -1)
        {
            // console.log(document.styleSheets[i].ownerNode);
            return;
        }
    }

    var sheet = document.createElement('link');
    sheet.rel = 'stylesheet';
    sheet.href = href;
    document.head.appendChild(sheet);
}

async function fetchData(url, isJson)
{
    const resp = await fetch(url);
    const data = await isJson ? resp.json() : resp.text();
    
    return data;
}

function isScrolledIntoView(elm)
{
    var bcr = elm.getBoundingClientRect();
    var elemTop = bcr.top, elemBottom = bcr.bottom;

    return (elemTop >= 0) && (elemBottom <= window.innerHeight);
}

function setActiveSidebarArticle()
{    
    var sidebar = document.querySelector("ul.sidebar-articles");
    var aTags = sidebar.getElementsByTagName('a');
    
    for (var i = 0; i < aTags.length; i++)
    {
        if (aTags[i].getAttribute('href') != window.location.pathname)
            continue;
        
        // Category clicked
        if (aTags[i].parentNode.classList[0] == "sidebar-category-name")
            aTags[i].closest('li').classList.add('active'/*, 'current-page'*/);
        // Topic clicked
        else if (aTags[i].parentNode.classList[0] == "sidebar-topic")
        {
            aTags[i].parentNode.classList.add('active', 'current-page');
            aTags[i].closest('li.sidebar-category').classList.add('active');
        }
        // Subtopic clicked
        else if (aTags[i].parentNode.classList[0] == 'sidebar-subtopic')
        {
            aTags[i].parentNode.classList.add('active', 'current-page');
            aTags[i].closest('li.sidebar-topic').classList.add('active');
            aTags[i].closest('li.sidebar-category').classList.add('active');
        }
        
        // Ensure <details> always gets the 'open' attribute so that it does
        // not collapse on link clicks        
        aTags[i].closest('details.expando').setAttribute("open", "");
        
        if (!isScrolledIntoView(aTags[i]))
            aTags[i].scrollIntoView();
    }
}

function expandSidebarCategory(index)
{
    var elm = document.getElementsByClassName('expando details')[index];
    if (elm)
        elm.setAttribute('open', '');
}

function getArticlesElement()
{
    return document.getElementsByClassName('sidebar-articles')[0];
}

function autocompleteInput(inp, arr) 
{
    var focusedListItem = -1;

    inp.addEventListener("input", function(e)
    {
        removeListItem();
        
        var val = this.value.toLowerCase();
        if (!val)
            return false;
        
        var acList = document.createElement('div');
        acList.setAttribute('class', 'autocomplete-list');
        
        this.parentNode.appendChild(acList);
        
        for (var i = 0; i < arr.length; i++)
        {
            var arrItem = arr[i].article.toLowerCase();
            if (val.length > 1 && arrItem.indexOf(val) > -1)
            {
                getArticlesElement().style.display= "none";
                
                var temp = document.createElement("div");
                acList.appendChild(temp);
                temp.outerHTML = populateList(arr[i].article, arr[i].link, val);
            }
        }
        
        if (acList.firstChild)
            document.addEventListener("click", onMouseClick);
    });

    inp.addEventListener("keydown", function(e)
    {
        var acList = document.getElementsByClassName('autocomplete-list')[0];
        if (acList)
            acList = acList.getElementsByTagName("div");
        
        // Down arrow
        if (e.keyCode == 40)
        {
            focusedListItem++;
            addActiveClass(acList);
        }
        // Up arrow
        else if (e.keyCode == 38)
        { 
            focusedListItem--;
            addActiveClass(acList);
        }
        // Esc
        else if (e.keyCode == 27)
            removeListItem();
        // Enter
        else if (e.keyCode == 13)
        {
            e.preventDefault();
            
            if (acList && focusedListItem > -1)
                acList[focusedListItem].click();
        }
    });
  
    function populateList(data, href, inputMatch)
    {
        inputMatch = inputMatch.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        var exp = new RegExp("(" + inputMatch.split(' ').join('|') + ")", "gi");
        
        return `<div ac-data='${data}' href='${href}'>${data.replace(exp, "<b>$1</b>")}</div>`;
    }
    
    function removeListItem(elm)
    {
        var acList = document.getElementsByClassName("autocomplete-list");
        for (var i = 0; i < acList.length; i++)
        {
            if (elm != acList[i] && elm != inp)
                acList[i].parentNode.removeChild(acList[i]);
        }

        if (!acList[0])
        {
            getArticlesElement().style.display= "block";
            document.removeEventListener("click", onMouseClick);
        }
    }
  
    function addActiveClass(elm)
    {
        if (!(elm && elm.length > 0))
            return;
      
        removeActiveClass(elm);
        
        if (focusedListItem >= elm.length)
            focusedListItem = 0;
        else if (focusedListItem < 0)
            focusedListItem = elm.length - 1;
    
        elm[focusedListItem].classList.add("active");
    }
  
    function removeActiveClass(elm)
    {
        for (var i = 0; i < elm.length; i++)
            elm[i].classList.remove("active");
    }
    
    function onMouseClick(e)
    {
        removeListItem(e.target);
        
        if (e.target.getAttribute("ac-data") != null)
            location = e.target.getAttribute("href");
    }
}

function genArticleBodyToc()
{
    var toc = document.getElementsByClassName('article-toc')[0];
    if (!toc)
        return;

    var title = document.createElement('h4');
    title.textContent = "On this page";

    toc.appendChild(title);

    var articleBody = document.getElementsByClassName('main-body')[0];
    var headings = [].slice.call(articleBody.querySelectorAll('h2, h3'));

    headings.forEach(function (heading, index) 
    {
        var ref = "hRef" + index;
        if (heading.hasAttribute('id')) 
            ref = heading.getAttribute('id');
        else
            heading.setAttribute('id', ref);
        
        heading.classList.add('heading-anchor');

        var anchorlink = document.createElement('a');
        anchorlink.setAttribute('href', "#" + ref);
        anchorlink.classList.add('anchor');
        
        heading.insertBefore(anchorlink, heading.firstChild);

        var jumpLink = document.createElement('a');
        jumpLink.setAttribute('href', "#" + ref);

        if (headings[index].tagName !== 'H3')
            jumpLink.textContent = heading.textContent;
        else
        {
            var paddedSpan = document.createElement('span');
            paddedSpan.classList.add('subHeading');
            paddedSpan.textContent = heading.textContent;

            jumpLink.appendChild(paddedSpan);
        }

        toc.appendChild(jumpLink);
    });
}

function genSidebarCategoryToc(onlyCategoryNames)
{
    var tocList = document.getElementsByClassName('sidebar-topic-toc')[0].children[1];
    
    var q, i;
    if (onlyCategoryNames)
    {
        q = document.querySelectorAll('div.sidebar-category-name a');
        i = 0;
    }
    else
    {
        q = document.querySelectorAll('ul.sidebar-articles .active a');
        i = 1; // Skip category names
    }

    var subListHead = document.createElement('ol');
    
    for (i; i < q.length; i++)
    {
        if (q[i].parentNode.classList.contains('sidebar-subtopic'))
        {
            var listSubItem = document.createElement("li");
            listSubItem.innerHTML = `<a href='${q[i].href}'>${q[i].innerText}</a>`;
            
            subListHead.appendChild(listSubItem);
            listItem.appendChild(subListHead);
        }
        else
        {
            var listItem = document.createElement("li");
            listItem.innerHTML = `<a href='${q[i].href}'>${q[i].innerText}</a>`;
    
            tocList.appendChild(listItem);
        }
    }
}

function getReadingTime(elmQuery)
{
    var query = document.querySelectorAll(elmQuery);
    var wordCount = 0;

    for (var i = 0; i < query.length; i++)
        wordCount += query[i].innerText.match(/\w+/g).length;

    const avgWpm = 100;
    
    var wordsPerSec = avgWpm / 60;
    var totalReadingTimeSeconds = wordCount / wordsPerSec;

    var readingTimeMin = Math.floor(totalReadingTimeSeconds / 60);
    if (readingTimeMin < 1)
        return; // result is too negligible to bother with

    var readingTimeSec = Math.round(totalReadingTimeSeconds - (readingTimeMin * 60));
    if (readingTimeSec > 45)
        readingTimeMin++;

    var format = null;
    if (readingTimeMin > 60)
    {
        var hour = Math.floor(readingTimeMin / 60);
        var minute = (readingTimeMin % 60).toString();

        if (minute >= 10)
        {
            minute = minute.slice(0, (minute.indexOf(".")) + 2);
            format = hour + "." + minute + " hours to read";
        }
        else
            format = hour + ((hour > 1) ? " hours to read" : " hour to read");
    }
    else
    {
        format = (readingTimeMin > 1) ? readingTimeMin + " minutes to read" :
                                        readingTimeMin + " minute to read";
    }

    var elm = document.getElementsByClassName('readingTime')[0];
    if (elm)
    {
        elm.innerText = format;
        elm.style.display = 'block';
    }
}

function handleImageHover(elm)
{
    if (elm.clientWidth < elm.naturalWidth)
    {
        elm.style.cursor = "pointer";
        elm.setAttribute('onclick', 'showImageOverlay(this)');
    }
    else
    {
        elm.removeAttribute('style');
        elm.removeAttribute('onclick');
    }
}

function showImageOverlay(elm)
{
    var overlayContainer = elm.parentNode.querySelector('div.image-overlay');
    if (overlayContainer == null)
    {
        var container = document.createElement('div');
        container.classList.add('image-overlay');
        container.setAttribute('onclick', 'hideImageOverlay(this)');

        elm.parentNode.appendChild(container);
        
        container.innerHTML = `<img src='${elm.getAttribute("src")}'>`;
        overlayContainer = container;
    }

    overlayContainer.style.display = "flex";
    document.getElementsByTagName('html')[0].style.overflow = "hidden";
}

function hideImageOverlay(elm)
{
    elm.parentNode.removeChild(elm);
    document.getElementsByTagName('html')[0].style.overflow = "auto";
}

(function ()
{
    setActiveSidebarArticle();
    genArticleBodyToc();
    getReadingTime('.main-body p, .main-body li');

    var theme = localStorage.getItem('theme');
    if (theme == null)
        setTheme('theme-default');
    else
    {
        if (theme === 'theme-dark')
            document.getElementById('themeToggle').checked = true;
    }

    fetchData('/static/articles.json', true).then(data =>
    {
        const searchInp = document.getElementsByClassName('sidebar-search')[0];
        autocompleteInput(searchInp, data);
    });
})();