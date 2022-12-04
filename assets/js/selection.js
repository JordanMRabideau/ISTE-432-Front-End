"use strict";

// Page to load active campaigns the logged in user is a part of

function xhr(getPost, url, data) {
  return $.ajax({
    type: getPost,
    data: data,
    dataType: "json",
    cache: false,
    async: true,
    url: url,
  }).fail(function (err) {
    console.log(err);
  });
}

$(document).ready(function () {
    const societyId = window.localStorage.getItem("society")
    const memberId = window.localStorage.getItem("user")
    xhr("get", `http://localhost:3000/api/societies/${societyId}`, {}).done(
        function (json) {
            const society = json[0];

            const title = `<h1>${society.name}</h1>`;
            const list = `<ul id="selections"></ul`;
            $("#title-div").append(title);
            $("#campaign-div").append(list);
        }
    )
  
    xhr("get", `http://localhost:3000/api/campaigns/${societyId}/${memberId}`, {}).done(
      function (json) {
        const campaign = json;
        if (campaign.length != 0) {
          campaign.forEach((element) => {
            let name = `<li><a href="./ballot.html?campaign_id=${element.campaign_id}"><button class="button"><span></span>${element.name}</button></a></li>`;
            $("#selections").append(name);
          });
        } else {
          const placeholder = `<h2>There are currently no active campaigns.</h2>`
          $("#selections").append(placeholder);
        }

      }
    );
});