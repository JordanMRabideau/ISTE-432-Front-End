"use strict";

// Page to load candidate information for user to review

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
  const campaignId = params.get("campaign_id");

  xhr("get", `http://localhost:3000/api/campaign/info/${campaignId}`, {}).done(
    function (json) {
      const campaign = json[0];

      const title = `<h1>${campaign.name} - Candidate Information</h1><h2>${campaign.society_name}</h2><br>`;

      $("#title-div").append(title);
    }
  );

  xhr("get", `http://localhost:3000/api/campaign/results/${campaignId}`, {}).done(
    function (json) {
      const data = json;
      data.forEach((element) => {
        console.log(element)
        let candidate = `<div class="can_info">Name: ${element.name}<br>`;

        if (element.image_filepath) {
          candidate += `<img src=${element.image_filepath.replace("C:\\fakepath\\", "../assets/images/")} height="100px" width="auto"/><br>`
        }

        if (element.title) {
          candidate += `Title: ${element.title}<br>`
        }

        if (element.bio) {
          candidate += `Bio: ${element.bio}`
        }

        candidate += `</div>`
        $("#candidate-div").append(candidate);
      });
    });

    $("#back").click(function() {
      window.location.href = `./ballot.html?campaign_id=${campaignId}`
    })
});