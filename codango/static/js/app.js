$.ajaxSetup({
    headers: {
        "X-CSRFToken": $("meta[name='csrf-token']").attr("content")
    },
    beforeSend:function(){
        $("#preloader").show();
    },
    complete:function(){
        $("#preloader").hide();
    }
});
var myDataRef = new Firebase('https://popping-inferno-54.firebaseio.com/');

function socialLogin(user) {
    var ajaxinfo = {
        url: "/login",
        type: "POST",
        data: user,
        success: function(data) {
            if (data == "success") {
                location.reload();
            }
            if (data == "register") {
                $("#tab_link").trigger("click");
                if (user.first_name !== undefined) {
                    $("#signup-form").append("<input type='hidden' name='first_name' value='" + user.first_name + "'>");
                    $("#signup-form").append("<input type='hidden' name='last_name' value='" + user.last_name + "'>");
                } else {
                    $("#signup-form").append("<input type='hidden' name='first_name' value='" + user.given_name + "'>");
                    $("#signup-form").append("<input type='hidden' name='last_name' value='" + user.family_name + "'>");
                }

                $("#signup-form").append("<input type='hidden' name='social_id' value='" + user.id + "'>");
                $("#id_email").val(user.email);
            }
        },
        error: function(error) {
            console.log(error.responseText)
        }
    };
    $.ajax(ajaxinfo);
}

function loadComments(_this) {
    var selector = "#" + _this.closest(".comments").attr("id");
    $(selector).load(document.URL + " " + selector);
}


var facebookLogin = {
    config: {
        login: "#facebook-login",
        fb_id: "1472709103038197"
    },
    init: function(config) {
        $(facebookLogin.config.login).attr("disabled", true);
        if (config && typeof(config) == "object") {
            $.extend(facebookLogin.config, config);
        }
        $.getScript("//connect.facebook.net/en_US/sdk.js", function() {
            FB.init({
                appId: facebookLogin.config.fb_id,
                version: "v2.5"
            });
            $(facebookLogin.config.login).attr("disabled", false);
        });
        $(facebookLogin.config.login).click(function(e) {
            e.preventDefault();
            facebookLogin.login();
        });
    },
    login: function() {
        FB.login(function(response) {
            if (response.authResponse) {
                console.log("Welcome!  Fetching your information.... ");
                FB.api("/me?fields=email,first_name,last_name,picture", socialLogin);
            } else {
                console.log("Not logged in");
            }
        }, {
            scope: "email,user_likes"
        });
    },
};

var googleLogin = {
    //This handles the configuration file for google social login
    config: {
        login: "#google-login",
        OAUTHURL: "https://accounts.google.com/o/oauth2/auth?",
        VALIDURL: "https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=",
        SCOPE: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
        CLIENTID: "58714074667-55ulgv6a4mfe63t3u4qdil3dumo6cmvv.apps.googleusercontent.com",
        REDIRECT: "http://localhost:8000",
        LOGOUT: "http://accounts.google.com/Logout",
        TYPE: "token",
    },
    //init funciton for the click event
    init: function(config) {
        if (config && typeof(config) == "object") {
            $.extend(googleLogin.config, config);
        }
        $(googleLogin.config.login).click(function(e) {
            googleLogin.login();
        });
    },
    //Login function
    login: function() {
        var __url = googleLogin.config.OAUTHURL + "scope=" + googleLogin.config.SCOPE + "&client_id=" + googleLogin.config.CLIENTID + "&redirect_uri=" + googleLogin.config.REDIRECT + "&response_type=" + googleLogin.config.TYPE;
        var win = window.open(__url, "windowname1", "width=800, height=600");
        var pollTimer = window.setInterval(function() {
            try {
                console.log(win.document.URL);
                if (win.document.URL.indexOf(googleLogin.config.REDIRECT) != -1) {
                    window.clearInterval(pollTimer);
                    var url = win.document.URL;
                    googleLogin.config.acToken = googleLogin.gup(url, "access_token");
                    var tokenType = googleLogin.gup(url, "token_type");
                    var xpiresIn = googleLogin.gup(url, "expires_in");
                    win.close();
                    googleLogin.validateToken(googleLogin.config.acToken);
                }
            } catch (e) {}
        }, 500);
    },
    gup: function(url, name) {
        name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
        var regexS = "[\\#&]" + name + "=([^&#]*)";
        var regex = new RegExp(regexS);
        var results = regex.exec(url);
        if (results === null) return "";
        else return results[1];
    },
    validateToken: function(token) {
        $.ajax({
            url: googleLogin.config.VALIDURL + token,
            data: null,
            success: function(responseText) {
                googleLogin.getGoogleUserInfo();
            },
            dataType: "jsonp"
        });
    },
    getGoogleUserInfo: function() {
        $.ajax({
            url: "https://www.googleapis.com/oauth2/v1/userinfo?access_token=" + googleLogin.config.acToken,
            data: null,
            success: socialLogin,
            dataType: "jsonp"
        });
    }
};

var ajaxContent = {
    config: {
        contentDiv: "#community-content"
    },
    init: function(config) {
        if (config && typeof(config) == "object") {
            $.extend(ajaxContent.config, config);
        }
        $("body").on("click", ajaxContent.config.filter,function(e) {
            e.preventDefault(); 
            _this = $(this);
            if(!(_this.closest("ul").hasClass("filter-menu"))) $("#community a").removeClass("active");
            _text = _this.text().replace(/\s+/g, "");; 
            $("#community a").each(function() {
                if($(this).text().replace(/\s+/g, "") == _text)
                { 
                    $(this).addClass("active")
                    return; 
                }
            });
            $(this).addClass("active");
            var url = ajaxContent.buildUrl($(this));
            ajaxContent.loadContent(url);
            window.history.pushState("object or string", "Title", url);
        });
    },
    buildUrl: function(_this) {
        _this.closest("ul").closest("li").removeClass("open");
        if (_this.hasClass("filterby")) return location.protocol + "//" + location.host + location.pathname + _this.attr("href");
        return _this.attr("href");
    },
    loadContent: function(url) {
        $(ajaxContent.config.contentDiv).load(url, ajaxContent.afterAction);
    },
    afterAction: function(data, status, xhr) {
        $("#sidebar-mobile-link").show();
        $("#sidebar-mobile").animate({
            "left": "-=200px"
        });
        prettyPrint();
    }
};


var formPost = {
    config: {
        share: "#id_share_form"
    },
    init: function(config) {

        if (config && typeof(config) == "object") {
            $.extend(formPost.config, config);
        }
        $("body").on("submit", formPost.config.share, function(e) {
            e.preventDefault();
            var fd = formPost.formContents($(this));
            var url = $(this).attr("action");
            formPost.share(url, fd, $(this));
        });
    },
    formContents: function(_this) {
        var fd = new FormData();
        if (_this.hasClass("share")) {
            var file_data = _this.find("input[type='file']")[0].files[0];
            fd.append("resource_file", file_data);
        }
        var other_data = _this.serializeArray();
        $.each(other_data, function(key, input) {
            fd.append(input.name, input.value);
        });
        return fd;
    },

    share: function(url, fd, _this) {

        $("#preloader").show();
        var data = _this.serializeArray();
        $.ajax({
            url: url,
            type: "POST",
            contentType: false,
            processData: false,
            data: fd,
            success: function(data) {
                if (typeof(data) == 'object') {
                    if(Array.isArray(data['user_id'])) {
                        data['user_id'].forEach(function(value){
                            //Re-assgin the call back variable
                            postData = data;
                            //set the user id to the current value
                            postData['user_id'] = value;
                            postDataToFireBase(postData);
                            postActivity(postData);

                        });
                    }
                else{
                    postDataToFireBase(data);
                    postActivity(data);
                }
                    _this.append("<div class='alert alert-success successmsg'>"+data['status']+"</div>");
                    setTimeout(function() {
                        $(".successmsg").hide();
                    }, 5000);
                }
            },
            error: function(status) {
                // Display errors
                console.log(status.responseText);
                if (status.responseText == "emptypost") {
                    _this.prepend("<div class='alert alert-danger errormsg'>Empty Post!!</div>");
                } else {
                    _this.prepend("<div class='alert alert-danger errormsg'>Invalid file type or greater than 10MB</div>");
                }
                setTimeout(function() {
                    $(".errormsg").hide();
                }, 5000);
            },
            complete: function() {
                if (_this.hasClass("share")) {
                    console.log(document.URL);
                    $("#community-content").load(document.URL, function() {
                        $("#id-snippet-body").hide();
                        $("#id-pdf-file").removeClass("show");
                        _this.trigger("reset");
                        prettyPrint();
                    });
                } else {
                    selector = "#rcomments-" + data[1]["value"];
                    $(selector).load(document.URL + " " + selector);
                    commentcount = ".commentcount-" + data[1]["value"];
                    $(commentcount).load(document.URL + " " + commentcount);
                }
                _this.trigger("reset");
            }
        });
    }
};

var mobileNav = {
    config: {
        linkNav: "#sidebar-mobile-link i"
    },
    init: function(config) {
        if (config && typeof(config) == "object") {
            $.extend(mobileNav.config, config);
        }
        $(mobileNav.config.linkNav).click(function(e) {
            e.preventDefault();
            mobileNav.showNav($(this));
        });
    },
    showNav: function(_this) {
        if (_this.hasClass("glyphicon glyphicon-chevron-right")) {
            $("#sidebar-mobile-link").hide();
            $("#sidebar-mobile").animate({
                "left": "0px"
            });
        }
    }
};

var votes = {
    config: {
        voteButton: ".like, .unlike"
    },
    init: function(config) {
        if (config && typeof(config) == "object") $.extend(votes.config, conifg);
        $("body").on("click", votes.config.voteButton, function(e) {
            e.preventDefault();
            var url = $(this).attr("href");
            var resource_id = $(this).data("id");
            votes.doVote(url, resource_id, $(this));
        });
    },
    doVote: function(url, resource_id, _this) {
        $.ajax({
            url: url,
            type: "POST",
            data: {
                resource_id: resource_id
            },
            success: function(data) {
                postDataToFireBase(data);
                postActivity(data);
                if (data["status"] == "novote") _this.removeClass("active");
                else _this.addClass("active")
                if (_this.hasClass("like")) {
                    _this.siblings(".unlike").removeClass("active").find("span").html("&nbsp;&nbsp;"+data["downvotes"])
                    _this.find("span").html("&nbsp;&nbsp;"+data["upvotes"])
                } else {
                    _this.siblings(".like").removeClass("active").find("span").html("&nbsp;&nbsp;"+data["upvotes"])
                    _this.find("span").html("&nbsp;&nbsp;"+data["downvotes"])
                }
            },
            error: function(x) {
                console.log(x.responseText)
            }
        });
    }
}


function loadComments(_this){
            var selector = "#" + _this.closest(".comments").attr("id");
            $(selector).load(document.URL + " " +selector);
        }

function postDataToFireBase(data){
    firebaseData = {
        link: data["link"],
        activity_type: data["type"],
        read: data["read"],
        content:data["content"],
        user_id: data["user_id"],
        created_at: Firebase.ServerValue.TIMESTAMP
    };

    myDataRef.push(firebaseData);


}

function postActivity(data){
    $.ajax({
        url: "http://localhost:8000/user/activity/",
        type:"POST",
        data:data,
        success:function(data){
            console.log(data);
        },
        error: function(x){
            console.log(x.responseText)

        }
    })

}

var deleteComment = {
    config: {
        button: ".delete-comment",
    },
    init: function(config) {
        if (config && typeof config == "object") $.extend(deleteComment.config, config);
        $("body").on("click", deleteComment.config.button, function(e) {
            e.preventDefault();
            if (!confirm("Are you sure you want to delete this comment")) return;
            deleteComment.sendAction($(this));
        })
    },
    sendAction: function(_this) {
        $.ajax({
            url: _this.attr("href"),
            type: "DELETE",
            success: loadComments(_this),
            error: function(res) {
                console.log(res.responseText);
            }
        });
    }
};

var editComment = {
    config: {
        button: ".edit-comment"
    },
    init: function(config) {
        if (config && typeof config == "object") $.extend(editComment.config, config);
        $("body").on("submit", editComment.config.button, function(e) {
            e.preventDefault();
            editComment.sendAction($(this));
        })
    },
    sendAction: function(_this) {
        $.ajax({
            url: _this.attr("action"),
            type: "PUT",
            contentType: "application/json; charset=utf-8",
            processData: false,
            data: JSON.stringify({
                "content": _this.find("textarea[name='content']").val()
            }),
            success: loadComments(_this),
            error: function(res) {
                console.log(res.responseText);
            }
        });
    }
};

var readNotification = {
    config: {
        button: "#notifications .list-group-item"
    },
    init: function(config) {
        if (config && typeof config == 'object') $.extend(readNotification.config, config);
        $("body").on('click', readNotification.config.button, function(e) {
            e.preventDefault();
            readNotification.readAction($(this));
        })
    },
    readAction: function(_this) {
        $.ajax({
            url: _this.data("url"),
            type: "PUT",
            contentType: 'application/json; charset=utf-8',
            processData: false,
            data: JSON.stringify({
                'id': _this.data("id")
            }),
            success: function(data){
                console.log(data)
                location.assign(_this.attr("href"));

            },
            error: function(res) {
                console.log(res.responseText);
            }
        });
    }
};
// Handling follow

var followAction = {
    config: {
        button: "#follow-btn"

    },
    init: function(config){
        if (config && typeof config == 'object') $.extend(followAction.config, config);
        $("body").on('click', followAction.config.button, function(e){
            e.preventDefault();
            var _this = $(this)
            var url = $(this).attr('href');
            followAction.doFollow(_this,url)
        })

    },
    doFollow: function(_this, url){
        $.ajax({
            url: url,
            type: 'POST',
            success: function(data,textStatus,xhr){
                postDataToFireBase(data);
                postActivity(data);
                $("h2.stats.followers").text(data['no_of_followers']);
                $("h2.stats.following").text(data['no_following']);
               
                _this.attr('disabled', true);
                _this.text('following')
            },
            error: function(x){
                console.log(x.responseText)
            }

        });

    }
};

var realTime = {
    config:{
        ulItems: "#notification-li", //for the ul elements from the fixed navbar
        panel: "#notifcation-panel", //the panel to add new notifcation real time
        newNotficationDiv: "#new-notifications", //The fixed new-notifications div at the bottom right
        timeoutid:2, //Timeout avoid memory leak
        newItems:false //variable to disable firebase real time loading all the ojects at once
    },
    init: function(config){
      if (config && typeof config == 'object') $.extend(realTime.config, config); 

      //If there is changes to the databsse initalize new items to true 
        myDataRef.once('value', function(messages) {
            realTime.config.newItems = true;

        });
        myDataRef.on("child_added", function(snapshot){
        if (!realTime.config.newItems) return;// if there is no new item dont load any div

        var activity = snapshot.val();//Value of the newly added database values
        if(activity.user_id == parseInt($(realTime.config.ulItems).data("id")))
        {
            realTime.loadNotifications(activity); 
            
        }
        
    });

    },
    newNotification: function(activity){
        //New items from the notificativity link
        newNotification = "<div class='list-group'>";
        newNotification += "<a href="+activity.link+" class='list-group-item'>";
        newNotification += "<h4 class='list-group-item-heading'>"+activity.activity_type + "</h4>";
        newNotification += "<p class='list-group-item-text'>"+ activity.content + "<br>";
        newNotification +="<small>about "+ Math.round((new Date() - new Date(activity.created_at))/60000) +" minutes ago<small></p>";
        newNotification += "</a>";
        newNotification+= "</div>";
        
        return newNotification;

    },
    loadNotifications: function(activity){
        $(realTime.config.ulItems).load($(realTime.config.ulItems).data("url"),function(){
            realTime.callbackDiv(activity)
        });

    },
    callbackDiv: function(activity){
        notifyDiv = realTime.newNotification(activity)
        $(realTime.config.panel).prepend(notifyDiv);
        $(realTime.config.newNotficationDiv).show();
        clearTimeout(realTime.config.timeoutid);
        realTime.config.timeoutid = setTimeout(function(){
            $(realTime.config.newNotficationDiv).fadeOut("slow");
        },4000);
    }
};


var eventListeners = {
    init: function() {
        // Shows the edit comments box
        $("body").on("click", ".show-edit", function(e) {
            e.preventDefault();
            $(this).closest("div").siblings(".edit-view").show();
            $(this).closest(".view").hide();
        });

        // Shows the comments when we stop editing
        $("body").on("click", ".show-view", function(e) {
            e.preventDefault();
            $(this).closest(".edit-view").hide();
            $(".view").show();
        })

        // Shows all the comments on a resource
        $(document).on("click", ".mdi-comment", function(e) {
            e.preventDefault();
            $(this).closest(".feed-content").find(".comments-div").toggle();
        });

        // Responsive view sidebar slide in
        $("#more a").click(function(e) {
            e.preventDefault();
            if ($("#sidebar-more").css("display") == "block") {
                $("#sidebar-more").css("display", "none");
                $(this).text("...more...");
            } else {
                $("#sidebar-more").css("display", "block");
                $(this).text("...less...");
            }
        });

        // Shows the snippet box
        $("#id-snippet-button").click(function() {
            $("#id-snippet-body").toggle();
        });

        // Shows the file upload field
        $("#id-pdf-button").on("click", function(hidden) {
            hidden.preventDefault();
            $("#id-pdf-file").toggleClass("show");
        });

        // Ensures all flash messages fadeout after 2 seconds
        setTimeout(function() {
            $("#flash-message").fadeOut();
        }, 2000)
    }
};

$(document).ready(function() {
    realTime.init();

    facebookLogin.init({
        //fb_id: "1472691016373339"
    });
    googleLogin.init({
        REDIRECT: "http://codango-staging.herokuapp.com/"
    });

    formPost.init({
        share: "#id_share_form, .commentform"
    });
    ajaxContent.init({
        filter: "#community a,.filter-menu a,#codango-link a"
    });
    editComment.init({
        button: ".edit-comment"
    })

    eventListeners.init();
    mobileNav.init();
    votes.init();
    deleteComment.init();
    followAction.init();
    readNotification.init({
        button: "#notifications .list-group-item"
    });

    $('#id-snippet-body').hide();
    $(document).click(function (e) {            
        $("#notifications").hide();

    });
 // Endless pagination plugin
    $.endlessPaginate({
        paginateOnScroll: true,
        paginateOnScrollMargin: 20
    });
    prettyPrint();

    $("body").on("click",".notification-icon",function(e){
        e.stopPropagation();
        e.preventDefault();
        $("#notifications").toggle();
    });
});
