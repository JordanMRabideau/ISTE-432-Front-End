"use strict";

// Page will load ballot questions with choices in one continuously scrolling page for user to select from and submit

function xhr(getPost, url, data, success, error) {
  const successCallback = success ? success : () => {}
  const errorCallback = error ? error : () => {}

  return $.ajax({
    type: getPost,
    data: data,
    dataType: "json",
    cache: false,
    async: true,
    url: url,
    success: successCallback,
    error: errorCallback
  }).fail(function (err) {
    console.log(err);
  });
}

// Get user choices
function getInputs() {
  const inputs = $("#questions :checked")
  let inputObjs = []
  inputs.each(function() {
    inputObjs.push({
      question_id: Number($(this).data().question),
      question: $(this).siblings("legend").text(),
      response_id: Number($(this).val()),
      response: $(this).siblings(`label[for=choice-${$(this).val()}]`).text()
    })
  })

  return inputObjs
}

// This will take the user's inputs and group them into questions to be printed to the modal
function groupInputs() {
  const inputs = getInputs();
  const questions = []

  inputs.forEach((i) => {
    let question = questions.find(q => q.question_id === i.question_id)
    
    // Create a new question if it doesnt already exist
    if (!question) {
      questions.push({
        question_id: i.question_id,
        question: i.question,
        responses: [
          {
            response_id: i.response_id,
            response: i.response
          }
        ]
      })
    } 
    
    else {
      question.responses.push({
        response_id: i.response_id,
        response: i.response
      })
    }
  })

  return questions
}

// Format questions according to placement
function formatQuestions(questions) {
  const sorted = questions.sort((a, b) => {
    if (a.question_placement === b.question_placement) {
      if (a.choice_placement > b.choice_placement) {
        return 1;
      }

      return -1;
    }
    if (a.question_placement > b.question_placement) {
      return 1;
    }

    return -1;
  });
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

  return formatted;
}



$(document).ready(function () {
  const query = window.location.search;
  const params = new URLSearchParams(query);
  const campaignId = params.get("campaign_id");
  const societyId = window.localStorage.getItem("society")
  const memberId = window.localStorage.getItem("user")

  // Open the review modal
  $("#ballot-div").on("click", "#check-ballot", function() {
    $("#selections").empty()

    const data = {
      society_id: societyId,
      campaign_id: campaignId,
      member_id: memberId,
      selections: groupInputs()
    }

    data.selections.forEach((selection) => {
      const item = `<h3>${selection.question}</h3>`
      $("#selections").append(item)
      
      selection.responses.forEach(choice => {
        const ch = `<p>${choice.response}</p>`
        $("#selections").append(ch)
      })

    })
    
    $("#confirm-modal").modal()
  })

  // Submit the ballot
  $("#submit-ballot").click(function() {
    const data = {
      society_id: societyId,
      campaign_id: campaignId,
      member_id: memberId,
      selections: getInputs()
    }

    xhr("post", "http://localhost:3000/api/ballot/submit", data, function(data) {
      window.location.href = "./campaign_selection.html"
    }).done(function(response) {
      console.log(response)
    })
  })

  // Close the modal
  $("#close-modal").click(function() {
    $.modal.close();
  })

  // Prevent user from checking the max amount of choices
  $("#ballot-div").on("click", "input:checkbox", function(event) {
    // event.preventDefault()
    const $clicked = $(this)
    const $siblings = $(this).siblings("input:checkbox")
    const max = $(this).parent().data().max

    // Only check if the user is trying to tick the checkbox
    if ($clicked.is(":checked")) {
      let currentlyChecked = 0
      
      $siblings.each(function() {
        if ($(this).is(":checked")) {
          currentlyChecked++
        }
      })

      if (currentlyChecked < max) {
        $clicked.prop("checked", true)
      } else {
        alert(`You may only select up to ${max} options.`)
        $clicked.prop("checked", false)
      }
    }
  })

  // Get campaign name and create form for questions
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
    `http://localhost:3000/api/campaign/results/${campaignId}`,
    {}
  ).done(function (json) {
    const formattedQuestions = formatQuestions(json);

    // Create the initial divs for each position/question
    formattedQuestions.forEach((element) => {
      let question = `
        <fieldset data-max="${element.maximum_selections}" class="question fieldset-auto-width"><legend>${element.question}</legend>
          <p>Select up to ${element.maximum_selections} choice(s)</p>`;
      // Add each choice
      element.choices.forEach((choice) => {
        question += `<input data-question="${element.question_id}" id="choice-${choice.response_id}" type="checkbox" class="choice" value="${choice.response_id}" name="${element.question_id}"/><label for="choice-${choice.response_id}">${choice.name}</label>
        <div class="tooltip">&#128712;<span class="tooltiptext">| Title: ${choice.title} | Bio: ${choice.bio}</span></div><br>`;
      });
      question += "</fieldset><br>";

      $("#questions").append(question);
    });

    const submitButton = `<button id='check-ballot'>Submit</button>`
    $("#ballot-div").append(submitButton)
  });
});
