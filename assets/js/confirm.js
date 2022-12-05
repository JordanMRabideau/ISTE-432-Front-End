"use strict";

function xhr(getPost, url, data, success, error) {
  const successCallback = success ? success : () => {};
  const errorCallback = error ? error : () => {};

  return $.ajax({
    type: getPost,
    data: data,
    dataType: "json",
    cache: false,
    async: true,
    url: url,
    success: successCallback,
    error: errorCallback,
  }).fail(function (err) {
    console.log(err);
  });
}

$(document).ready(function () {
  const query = window.location.search;
  const params = new URLSearchParams(query);
  const confimation = params.get("confirmation");

  $("#confirmation").append(confimation);

  $("#log-out").click(function () {
    window.localStorage.removeItem("user");
    window.location.href = "../index.html";
  });

  $("#home").click(function () {
    window.location.href = "./campaign_selection.html";
  });
});
