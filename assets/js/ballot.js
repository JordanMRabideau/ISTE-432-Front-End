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
function groupInputs(formatted) {
  console.log(formatted)
  const inputs = getInputs();
  const data = {
    missing: 0,
    questions: []
  }

  inputs.forEach((i) => {
    let question = data.questions.find(q => q.question_id === i.question_id)
    
    // Create a new question if it doesnt already exist
    if (!question) {
      data.questions.push({
        question_id: i.question_id,
        question: i.question,
        difference: 0,
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

    question = data.questions.find(q => q.question_id === i.question_id)

    question.difference = formatted.find(f => f.question_id === question.question_id).maximum_selections - question.responses.length
  })

  data.missing = formatted.length - data.questions.length

  return data
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
      image_filepath: item.image_filepath.replace("C:\\fakepath\\", "../assets/images/"),
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
  let formattedQuestions;

  // Open the review modal
  $("#ballot-div").on("click", "#check-ballot", function() {
    $("#selections").empty()

    const data = {
      society_id: societyId,
      campaign_id: campaignId,
      member_id: memberId,
      selections: groupInputs(formattedQuestions)
    }

    console.log(data)
    if (data.selections.missing > 0) {
      const warning = `*WARNING - You have not voted for ${data.selections.missing} option(s)*<br/>`
      $("#selections").append(warning)
    }

    data.selections.questions.forEach((selection) => {
      const item = `<h3>${selection.question}</h3>`
      $("#selections").append(item)

      if (selection.difference > 0) {
        const warning = `*WARNING - You may vote for ${selection.difference} more option(s) on this question*<br/>`
        $("#selections").append(warning)
      }
      
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
      window.location.href = `./confirm.html?confirmation=${data.ballot}`
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
    formattedQuestions = formatQuestions(json);
    // Create the initial divs for each position/question
    formattedQuestions.forEach((element) => {
      let question = `
        <fieldset data-max="${element.maximum_selections}" class="question fieldset-auto-width"><legend>${element.question}</legend>
          <p>Select up to ${element.maximum_selections} choice(s)</p>`;
      // Add each choice
      element.choices.forEach((choice) => {
        question += `
        <input data-question="${element.question_id}" id="choice-${choice.response_id}" type="checkbox" class="choice" value="${choice.response_id}" name="${element.question_id}"/><label for="choice-${choice.response_id}">${choice.name}</label>`
        
        // If the choice has any additional info, show the info
        if (choice.image_filepath || choice.title || choice.bio) {
          question += `<div class="tooltip">&#128712;<span class="tooltiptext">`

          //conditionally add existing information
          if (choice.image_filepath) {
            question += `<img src=${choice.image_filepath} height="100px" width="auto"/>`
          }
  
          if (choice.title) {
            question += `| Title: ${choice.title} `
          }
  
          if (choice.bio) {
            question += `| Bio: ${choice.bio}`
          }
  
          question += `</span></div><br>`;

        }
      });
      question += "</fieldset><br>";

      $("#questions").append(question);
    });

    const submitButton = `<button id='check-ballot'>Submit</button>`
    $("#ballot-div").append(submitButton)
  });

  $("#show-candidates").click(function() {
    window.location.href = `./candidate_info.html?campaign_id=${campaignId}`
  })
});
