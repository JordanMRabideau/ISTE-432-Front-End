"use strict";

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
    const query = window.location.search;
    const params = new URLSearchParams(query);
    const societyId = params.get("society_id");

    xhr("get", `http://localhost:3000/api/societies/${societyId}`, {}).done(
        function (json) {
            const society = json[0];

            const title = `<h1>${society.name}</h1>`;
            const list = `<ul id="selections"></ul`;
            $("#title-div").append(title);
            $("#campaign-div").append(list);
        }
    )
  
    xhr("get", `http://localhost:3000/api/societies/campaigns/${societyId}`, {}).done(
      function (json) {
        const campaign = json;
        campaign.forEach((element) => {
            let name = `<li><a class="button" href="./ballot.html?campaign_id=${element.campaign_id}"><span></span><span></span><span></span><span></span>${element.name}</a></li>`;
            $("#selections").append(name);
        });
      }
    );
});