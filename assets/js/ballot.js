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

function formatQuestions(questions) {
  const sorted = questions.sort((a, b) => {
    if (a.question_placement === b.question_placement) {
      if (a.choice_placement > b.choice_placement) {
        return 1;
      }

      return 1;
    }
    if (a.question_placement > b.question_placement) {
      return 1;
    }

    return -1;
  });
  console.log(sorted);
  let formatted = [];

  sorted.forEach((item) => {
    let question = formatted.find((q) => q.question_id === item.question_id);
    const choice = {
      response_id: item.response_id,
      name: item.name,
      title: item.title,
      bio: item.bio,
      image_filepath: item.image_filepath,
      vote_count: item.vote_count,
    };
    // If the question isn't already in the formatted array, create the question and add it
    if (!question) {
      formatted.push({
        question_id: item.question_id,
        question: item.question,
        maximum_selections: item.maximum_selections,
        choices: [],
      });
      question = formatted.find((q) => q.question_id === item.question_id);
    }

    question.choices.push(choice);
  });

  console.log(formatted)

  return formatted;
}

$(document).ready(function () {
    const query = window.location.search;
    const params = new URLSearchParams(query);
    const campaignId = params.get("campaign_id");
  
    xhr("get", `http://localhost:3000/api/campaign/info/${campaignId}`, {}).done(
      function (json) {
        const campaign = json[0];
  
        const title = `<h1>${campaign.name}</h1>`;
        const question = `
        <form id="questions">
          <h2>${campaign.society_name}</h2>
        </form`;
  
        $("#title-div").append(title);
        $("#ballot-div").append(question);
      }
    );
    
  xhr(
    "get",
    `http://localhost:3000/api/campaign/results/${campaignId}`, {}).done(
      function (json) {
      const formattedQuestions = formatQuestions(json);

    // Create the initial divs for each position/question
    formattedQuestions.forEach((element) => {
      let question = `
        <fieldset class="fieldset-auto-width"><legend>${element.question}</legend>`;

      // Add each choice
      element.choices.forEach((choice) => {
        //swapped response_id for name
        question += `<input type="checkbox" value="${element.name}" name="${element.question_id}"/><label for="${element.question_id}">${choice.name}</label>
        <div class="tooltip">&#128712;<span class="tooltiptext">| Title: ${choice.title} | Bio: ${choice.bio}</span></div><br>`;
      });
      question += "</fieldset><br>";

      $("#ballot-div").append(question);
    });
  });
});