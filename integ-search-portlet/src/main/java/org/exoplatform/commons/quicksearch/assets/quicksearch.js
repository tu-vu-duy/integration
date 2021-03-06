
// Function to be called when the quick search template is ready
function initQuickSearch(portletId,seeAllMsg, noResultMsg, searching) {
  jQuery.noConflict();

  (function($){
    //*** Global variables ***
    var CONNECTORS; //all registered SearchService connectors
    var SEARCH_TYPES; //enabled search types
    var QUICKSEARCH_SETTING; //quick search setting

    var txtQuickSearchQuery_id = "#adminkeyword-" + portletId;
    var linkQuickSearchQuery_id = "#adminSearchLink-" + portletId;
    var quickSearchResult_id = "#quickSearchResult-" + portletId;
    var seeAll_id = "#seeAll-" + portletId;
    var value = $(txtQuickSearchQuery_id).val();
    var isDefault = false;
    var isEnterKey = false;
    window['isSearching'] = false;
    var durationKeyup = 0;
    var firstKeyup = 0;
    var nextKeyup = 0;
    var skipKeyup = 0;
    var textVal = "";
    var firstBackSpace = true;
    var index = 0;
    var currentFocus = 0;
    //var skipKeyUp = [9,16,17,18,19,20,33,34,35,36,37,38,39,40,45,49];
    
    var mapKeyUp = {"0":"48","1":"49","2":"50","3":"51","4":"52","5":"53","6":"54","7":"55","8":"56","9":"57",
    		"a":"65","b":"66","c":"67","d":"68","e":"69","f":"70","g":"71","h":"72","i":"73","j":"74",
    		"k":"75","l":"76","m":"77","n":"78","o":"79","p":"80","q":"81","r":"82","s":"83","t":"84",
    		"u":"85","v":"86","w":"87","x":"88","y":"89","z":"90","numpad 0":"96","numpad 1":"97","numpad 2":"98",
    		"numpad 3":"99","numpad 4":"100","numpad 5":"101","numpad 6":"102","numpad 7":"103", "backspace":"8", "delete":"46"};

    var QUICKSEARCH_RESULT_TEMPLATE= " \
      <div class='quickSearchResult %{type}' tabindex='%{index}' id='quickSearchResult%{index}'> \
        <span class='avatar'> \
          %{avatar} \
        </span> \
       	<a href='%{url}' class='name'>%{title}</a> \
      </div> \
    ";//<div class='Excerpt Ellipsis'>%{excerpt}</div> \

    var QUICKSEARCH_TABLE_TEMPLATE=" \
          <table class='uiGrid table table-striped  rounded-corners'> \
            <col width='30%'> \
            <col width='70%'> \
            %{resultRows} \
            %{messageRow} \
          </table> \
        ";

    var QUICKSEARCH_TABLE_ROW_TEMPLATE=" \
          <tr> \
            <th> \
              %{type} \
            </th> \
            <td> \
              %{results} \
            </td> \
          </tr> \
        ";

    var QUICKSEARCH_SEE_ALL=" \
        <tr> \
          <td colspan='2' class='message'> \
            <a id='seeAll-" + portletId + "' class='' href='#'>"+seeAllMsg+"</a> \
          </td> \
        </tr> \
        ";

    var QUICKSEARCH_NO_RESULT=" \
        <tr> \
          <td colspan='2' class='noResult'> \
            <span id='seeAll-" + portletId + "' class='' href='#'>"+noResultMsg+" <strong>%{query}<strong></span> \
          </td> \
        </tr> \
        ";

    var IMAGE_AVATAR_TEMPLATE = " \
      <span class='avatar pull-left'> \
        <img src='%{imageSrc}'> \
      </span> \
    ";

    var CSS_AVATAR_TEMPLATE = " \
      <span class='avatar pull-left'> \
        <i class='%{cssClass}'></i> \
      </span> \
    ";

    var EVENT_AVATAR_TEMPLATE = " \
      <div class='calendarBox calendarBox-mini'> \
        <div class='heading'> %{month} </div> \
        <div class='content' style='margin-left: 0px;'> %{date} </div> \
      </div> \
    ";

    var TASK_AVATAR_TEMPLATE = " \
      <i class='uiIconStatus-20-%{taskStatus}'></i> \
    ";  
    
    var QUICKSEARCH_WAITING_TEMPLATE=" \
        <table class='uiGrid table  table-hover table-striped  rounded-corners'> \
          <col width='30%'> \
          <col width='70%'> \
	        <tr> \
	          <td colspan='2' class='noResult'> \
	            <span id='seeAll-" + portletId + "' class='' href='#'>"+searching+" </span> \
	          </td> \
	        </tr> \
        </table> \
      ";    

    //*** Utility functions ***
    // Highlight the specified text in a string
    String.prototype.highlight = function(words) {
      var str = this;
      for(var i=0; i<words.length; i++) {
        if(""==words[i]) continue;
        var regex = new RegExp("(" + words[i] + ")", "gi");
        str = str.replace(regex, "<strong>$1</strong>");
      }
      return str;
    };


    function getRegistry(callback) {
      $.getJSON("/rest/search/registry", function(registry){
        if(callback) callback(registry);
      });
    }


    function getQuicksearchSetting(callback) {
      $.getJSON("/rest/search/setting/quicksearch", function(setting){
        if(callback) callback(setting);
      });
    }

    function setWaitingStatus(status) {
    	if (status){
    		window['isSearching'] = true;
            $(quickSearchResult_id).html(QUICKSEARCH_WAITING_TEMPLATE);
            if ($.browser.msie  && parseInt($.browser.version, 10) == 8) {
            	$(quickSearchResult_id).show();              
            }else{
            	var width = Math.min($(quickSearchResult_id).width(), $(window).width() - $(txtQuickSearchQuery_id).offset().left - 20);
            	$(quickSearchResult_id).width(width);
            	$(quickSearchResult_id).show();                      	
            }            
    	}else {
    		window['isSearching'] = false;    		
    	}    	    
    	
    }

    function quickSearch() {
      var query = $(txtQuickSearchQuery_id).val();
      setWaitingStatus(true);
      var types = QUICKSEARCH_SETTING.searchTypes.join(","); //search for the types specified in quick search setting only

      var searchParams = {
        searchContext: {
          siteName:parent.eXo.env.portal.portalName
        },
        q: query,
        sites: QUICKSEARCH_SETTING.searchCurrentSiteOnly ? parent.eXo.env.portal.portalName : "all",
        types: types,
        offset: 0,
        limit: QUICKSEARCH_SETTING.resultsPerPage,
        sort: "relevancy",
        order: "desc"
      };
      
      
      
      // get results of all search types in a map
      $.getJSON("/rest/search", searchParams, function(resultMap){
        var rows = []; //one row per type
        index = 0;
        $.each(SEARCH_TYPES, function(i, searchType){          
          var results = resultMap[searchType]; //get all results of this type
          if(results && 0!=$(results).size()) { //show the type with result only        	 
            //results.map(function(result){result.type = searchType;}); //assign type for each result
            $.map(results, function(result){result.type = searchType;}); //assign type for each result
            var cell = []; //the cell contains results of this type (in the quick search result table)
            $.each(results, function(i, result){
              index = index + 1; 	
              cell.push(renderQuickSearchResult(result, index)); //add this result to the cell
            });
            var row = QUICKSEARCH_TABLE_ROW_TEMPLATE.replace(/%{type}/g, CONNECTORS[searchType].displayName).replace(/%{results}/g, cell.join(""));
            rows.push(row);
          }
        });
                        
        var messageRow = rows.length==0 ? QUICKSEARCH_NO_RESULT.replace(/%{query}/, query) : QUICKSEARCH_SEE_ALL;
        $(quickSearchResult_id).html(QUICKSEARCH_TABLE_TEMPLATE.replace(/%{resultRows}/, rows.join("")).replace(/%{messageRow}/g, messageRow));
        if ($.browser.msie  && parseInt($.browser.version, 10) == 8) {
        	$(quickSearchResult_id).show();              
        }else{
        	var width = Math.min($(quickSearchResult_id).width(), $(window).width() - $(txtQuickSearchQuery_id).offset().left - 20);
        	$(quickSearchResult_id).width(width);
        	$(quickSearchResult_id).show();                      	
        }              
        
        setWaitingStatus(false);
        
        var searchPage = "/portal/"+parent.eXo.env.portal.portalName+"/search";
        $(seeAll_id).attr("href", searchPage +"?q="+query+"&types="+types); //the query to be passed to main search page      
        currentFocus = 0;
      });
    }


    function renderQuickSearchResult(result, index) {
      var query = $(txtQuickSearchQuery_id).val();
      var terms = query.split(/\s+/g); //for highlighting
      var avatar = "";

      switch(result.type) {
        case "event":
          var date = new Date(result.fromDateTime).toString().split(/\s+/g);
          avatar = EVENT_AVATAR_TEMPLATE.
            replace(/%{month}/g, date[1]).
            replace(/%{date}/g, date[2]);
          break;

        case "task":
          avatar = TASK_AVATAR_TEMPLATE.replace(/%{taskStatus}/g, result.taskStatus);
          break;

        case "file":
        	var cssClasses = $.map(result.fileType.split(/\s+/g), function(type){return "uiIcon24x24" + type}).join(" ");
        	if (result.imageUrl == null || !$.trim(result.imageUrl).length){
            	avatar = CSS_AVATAR_TEMPLATE.replace(/%{cssClass}/g, cssClasses);
        	}else{
            	avatar = IMAGE_AVATAR_TEMPLATE.replace(/%{imageSrc}/g, result.imageUrl);
        	}
        	avatar = "<a href='"+result.url+"'>" + avatar + "</a>";
        	break;
        case "document":
        //case "page":
          var cssClasses = $.map(result.fileType.split(/\s+/g), function(type){return "uiIcon24x24" + type}).join(" ");
          avatar = CSS_AVATAR_TEMPLATE.replace(/%{cssClass}/g, cssClasses);
          break;

        case "post":
          avatar = CSS_AVATAR_TEMPLATE.replace(/%{cssClass}/g, "uiIconUIForms");
          break;

        case "answer":
          avatar = CSS_AVATAR_TEMPLATE.replace(/%{cssClass}/g, "uiIconSocAnswersMini");
          break;

        default:
          avatar = IMAGE_AVATAR_TEMPLATE.replace(/%{imageSrc}/g, result.imageUrl);
      }


      var html = QUICKSEARCH_RESULT_TEMPLATE.
        replace(/%{index}/g, index).
        replace(/%{type}/g, result.type).
        replace(/%{url}/g, result.url).
        replace(/%{title}/g, (result.title||"").highlight(terms)).
        replace(/%{excerpt}/g, (result.excerpt||"").highlight(terms)).
        replace(/%{detail}/g, (result.detail||"").highlight(terms)).
        replace(/%{avatar}/g, avatar);

      return html;
    }


    //*** Event handlers - Quick search ***
    $(document).on("click",seeAll_id, function(){
      window.location.href = $(this).attr("href"); //open the main search page
      $(quickSearchResult_id).hide();
    });


    $(txtQuickSearchQuery_id).keyup(function(e){
      if(""==$(this).val()) {
        $(quickSearchResult_id).hide();
        return;
      }
      if(13==e.keyCode) {
        $(seeAll_id).click(); //go to main search page if Enter is pressed
      } else {
          //quickSearch(); //search for the text just being typed in
		  var currentVal = $(txtQuickSearchQuery_id).val();    	  
    	  if (!charDeletedIsEmpty(e,textVal, currentVal)){
    		  $.each(mapKeyUp, function(key, value){
        		  
    	    	  if (value == e.keyCode){
    	    		var query = $(txtQuickSearchQuery_id).val();
    	    		nextKeyup = new Date().getTime();	    
    	    		
    		    	if (query.length <= 2)
    		      	{
    		    		quickSearch(); //search for the text just being typed in
    		      	}else if (nextKeyup - firstKeyup >= 1000){
    			    		firstKeyup = nextKeyup;	    		
    			    		quickSearch(); //search for the text just being typed in	    		
    			    }else skipKeyup ++;
    		    	
    	 		    if (skipKeyup == 2)
    			    {
    				   skipKeyup = 0;
    				   quickSearch();
    				   firstKeyup = nextKeyup;
    				}
    	    	  }
    	    	  textVal = $(txtQuickSearchQuery_id).val();
        	  });
    	  }    	      	      	 
      }
    });
    
    //skip backspace and delete key
    function charDeletedIsEmpty(key,textVal, currentVal){
    	//process backspace key
    	if (key.keyCode == 8 && textVal.trim() == currentVal.trim()){
			return true;
    	}
    	//process delete key
    	if (key.keyCode == 46 && textVal.trim() == currentVal.trim()){
			return true;
    	}    	
    }
    // catch ennter key when search is running
    $(document).keyup(function (e) {
      if (e.keyCode == 13 && window['isSearching'] && !$(txtQuickSearchQuery_id).is(':hidden') ) {
    	  //$(quickSearchResult_id).focus();
          isDefault = false;
          $(linkQuickSearchQuery_id).trigger('click');    	  
    	  //$(linkQuickSearchQuery_id).click(); //go to main search page if Enter is pressed
      }
    });     
    
    $(document).keyup(function (e) {
    	if (e.keyCode == 13 && !$(txtQuickSearchQuery_id).is(':hidden') ) {
    		var focusedId = $("*:focus").attr("id");
    		if (currentFocus > 0 && currentFocus <= index){    			
    			var link = $("#"+focusedId+" .name").attr('href');
    			window.open(link,"_self");
    		}
    	}
    });
    
    // catch arrow key
    $(document).keyup(function (e) {
  	  if (index >= 1){

    	if (e.keyCode == 40 && !$(txtQuickSearchQuery_id).is(':hidden') ) {    		

    	  if (currentFocus >= 1 && currentFocus < index){
    		  var divClass = $('#quickSearchResult'+ currentFocus).attr('class').replace(" arrowResult", "");
    		  
    		  $('#quickSearchResult'+currentFocus).attr('class',divClass);
    	  }
    	  
    	  if (currentFocus < index){
	    	  currentFocus = currentFocus + 1;
	    	  $("#quickSearchResult"+currentFocus).focus();
	    	  var divClass = $('#quickSearchResult'+currentFocus).attr('class') + " arrowResult";
	    	  $('#quickSearchResult'+currentFocus).attr('class',divClass);	    	  
    	  }else if (currentFocus == index){
	    	  $("#quickSearchResult"+index).focus();
    	  }
      }
      
      if (e.keyCode == 38 && !$(txtQuickSearchQuery_id).is(':hidden') ) {

    	  if (currentFocus > 1){
    		  var divClass = $('#quickSearchResult'+ currentFocus).attr('class').replace(" arrowResult", "");
    		  
    		  $('#quickSearchResult'+currentFocus).attr('class',divClass);
    	  }
    	  
    	  if (currentFocus > 1){
	    	  currentFocus = currentFocus - 1;
	    	  $("#quickSearchResult"+currentFocus).focus();
	    	  var divClass = $('#quickSearchResult'+currentFocus).attr('class') + " arrowResult";
	    	  $('#quickSearchResult'+currentFocus).attr('class',divClass);	    	  
    	  }else if (currentFocus == 1){
    		  $("#quickSearchResult"+currentFocus).focus();
    	  }
      }      
  	  }
    });     
    
    //show the input search or go to the main search page when search link is clicked
    $(linkQuickSearchQuery_id).click(function () {
      if ($(txtQuickSearchQuery_id).is(':hidden')) {
        $(txtQuickSearchQuery_id).val(value);
        $(txtQuickSearchQuery_id).css('color', '#555');
        isDefault = true;
        $(txtQuickSearchQuery_id).show();
        $(txtQuickSearchQuery_id).focus();
      }
      else
      if (isDefault == true) {
          $(txtQuickSearchQuery_id).hide();
          $(quickSearchResult_id).hide();          
      }
      else {
    	  //alert(window['isSearching']);
    	  if(!window['isSearching']) {      
    		  $(seeAll_id).click(); //go to main search page if Enter is pressed
    	  }else if (window['isSearching']){    	  	 
          
	          var query = $(txtQuickSearchQuery_id).val();
	          var types = QUICKSEARCH_SETTING.searchTypes.join(","); //search for the types specified in quick search setting only
	
	          var searchParams = {
	            searchContext: {
	              siteName:parent.eXo.env.portal.portalName
	            },
	            q: query,
	            sites: QUICKSEARCH_SETTING.searchCurrentSiteOnly ? parent.eXo.env.portal.portalName : "all",
	            types: types,
	            offset: 0,
	            limit: QUICKSEARCH_SETTING.resultsPerPage,
	            sort: "relevancy",
	            order: "desc"
	          };          
	          var searchPage = "/portal/"+parent.eXo.env.portal.portalName+"/search";
	          $(linkQuickSearchQuery_id).attr("onclick","window.location.href='"+searchPage +"?q="+query+"&types="+types+"'");
	          window['isSearching'] = false;
    	  }
      }
    });       

    $(txtQuickSearchQuery_id).focus(function(){
      $(this).val('');
      $(this).css('color', '#000');
      isDefault = false;
    });


    //$(txtQuickSearchQuery_id).blur(function(){
    //  setTimeout(function(){$(quickSearchResult_id).hide();}, 200);
    //});

    //collapse the input search field when clicking outside the search box
    $('body').click(function (evt) {
      if ($(evt.target).parents('#ToolBarSearch').length == 0) {
        $(txtQuickSearchQuery_id).hide();
        $(quickSearchResult_id).hide();        
      }
    });

    //*** The entry point ***
    // Load all needed configurations and settings from the service to prepare for the search
    getRegistry(function(registry){
      CONNECTORS = registry[0];
      SEARCH_TYPES = registry[1];

      getQuicksearchSetting(function(setting){
        QUICKSEARCH_SETTING = setting;
      });

    });
  })(jQuery);

  $ = jQuery; //undo .conflict();
}
