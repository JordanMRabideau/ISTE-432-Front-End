"use strict";

// Page for members to log in

function xhr(getPost, url, data, successCallBack) {
  return $.ajax({
    type: getPost,
    data: data,
    dataType: "json",
    cache: false,
    async: true,
    url: url,
    success: successCallBack ? successCallBack : () => {},
    error: function (err, exception) {
      console.log(err);
      if (err.status === 401) {
        alert("Invalid login credentials");
      } else if (err.status === 502) {
        alert("Bad gateway");
      } else {
        alert("Uncaught exception");
      }
    },
  }).fail(function (err) {
    console.log(err);
  });
}

$(document).ready(function () {
  window.localStorage.setItem("society", 1); // The society is hardcoded for each site
  const societyId = window.localStorage.getItem("society");

  // Dynamically change values of the field placeholders for types of authentication
  xhr("get", `http://localhost:3000/api/authname/${societyId}`, {}).done(
    function (json) {
      const society = json[0];

      $("#auth1").attr("placeholder", society.auth1_name);
      $("#auth2").attr("placeholder", society.auth2_name);
    }
  );

  // Authenticate user input
  $("#login-form").submit(function (e) {
    e.preventDefault();
    const data = {
      auth1: $("#auth1").val(),
      auth2: $("#auth2").val(),
      society: societyId,
    };

    xhr("post", "http://localhost:3000/api/signin", data, function (data) {
      window.localStorage.setItem("user", data.user);
      window.location.href = "./pages/campaign_selection.html";
    });
  });
});
