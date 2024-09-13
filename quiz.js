/*
  Quick quiz bootstrap extension
*/
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

;(function($) {

// keep track of number of quizes added to page
var quiz_count = 0;

// 新增全局变量
var startTime, endTime;
var wrongQuestions = [];

// add jQuery selection method to create
// quiz structure from question json file
// "filename" can be path to question json
// or javascript object
$.fn.quiz = function(filename) {
  var $quiz = $(this);
  
  // 从API获取开始时间
  $.ajax({
    url: 'https://quiz-api.alanzoe.com/start_quiz',
    method: 'POST',
    success: function(data) {
      startTime = data.time;
      if (typeof filename === "string") {
        $.getJSON(filename, render.bind($quiz));
      } else {
        render.call($quiz, filename);
      }
    },
    error: function(error) {
      console.error('获取开始时间失败:', error);
      // 使用本地时间作为后备方案
      startTime = Math.floor(Date.now() / 1000);
      if (typeof filename === "string") {
        $.getJSON(filename, render.bind($quiz));
      } else {
        render.call($quiz, filename);
      }
    }
  });
};

// create html structure for quiz
// using loaded questions json
function render(quiz_opts) {


  // list of questions to insert into quiz
  var questions = quiz_opts.questions;

  // shuffle questions
  questions = shuffle(questions);

  // keep track of the state of correct
  // answers to the quiz so far
  var state = {
    correct : 0,
    total : questions.length,
    wrongQuestions: []
  };

  var $quiz = $(this)
    .attr("class", "carousel slide")
    .attr("data-ride", "carousel");

  // unique ID for container to refer to in carousel
  var name = $quiz.attr("id") || "urban_quiz_" + (++quiz_count);

  $quiz.attr('id', name);

  var height = $quiz.height();


  /*
    Add carousel indicators
  */


  /*
    Slides container div
  */
  var $slides = $("<div>")
    .attr("class", "carousel-inner")
    .attr("role", "listbox")
    .appendTo($quiz);

  /*
    Create title slide
  */
  var $title_slide = $("<div>")
    .attr("class", "item active")
    .attr("height", height + "px")
    .appendTo($slides);

  $('<h1>')
    .text(quiz_opts.title)
    .attr('class', 'quiz-title')
    .appendTo($title_slide);

  var $start_button = $("<div>")
    .attr("class", "quiz-answers")
    .appendTo($title_slide);

var $indicators = $('<ol>')
    .attr('class', 'progress-circles')

  $("<button>")
    .attr('class', 'quiz-button btn')
    .text("开始答题!")
    .click(function() {
      $quiz.carousel('next');
      $indicators.addClass('show');

    $(".active .quiz-button.btn").each(function(){
      console.log(this.getBoundingClientRect())
      $(this).css("margin-left", function(){
        return ((250 - this.getBoundingClientRect().width) *0.5) + "px"
      })
    })



    })
    .appendTo($start_button);

  $indicators
    .appendTo($quiz);

  $.each(questions, function(question_index, question) {
    $('<li>')
      .attr('class', question_index ? "" : "dark")
      .appendTo($indicators);
  });

  /*
    Add all question slides
  */
  $.each(questions, function(question_index, question) {

    var last_question = (question_index + 1 === state.total);

    var $item = $("<div>")
      .attr("class", "item")
      .attr("height", height + "px")
      .appendTo($slides);
    var $img_div;
    if (question.image) {
      $img_div = $('<div>')
        .attr('class', 'question-image')
        .appendTo($item);
      $("<img>")
        .attr("class", "img-responsive")
        .attr("src", question.image)
        .appendTo($img_div);
      $('<p>')
        .text(question.image_credit)
        .attr("class", "image-credit")
        .appendTo($img_div);
    }
    $("<div>")
      .attr("class", "quiz-question")
      .html(question.prompt)
      .appendTo($item);

    var $answers = $("<div>")
      .attr("class", "quiz-answers")
      .appendTo($item);

    // if the question has an image
    // append a container with the image to the item


    // for each possible answer to the question
    // add a button with a click event

    // randomize answers
    var min = Math.ceil(0);
    var max = Math.floor(question.answers.length - 1);
    var $right_answer = question.answers.splice(question.correct.index, 1);
    question.answers = shuffle(question.answers);
    question.correct.index = Math.floor(Math.random() * (max - min + 1)) + min
    question.answers.splice(question.correct.index, 0, $right_answer)

    $.each(question.answers, function(answer_index, answer) {

      // create an answer button div
      // and add to the answer container
      var ans_btn = $("<div>")
        .attr('class', 'quiz-button btn')
        .html(answer)
        .appendTo($answers);

      // This question is correct if it's
      // index is the correct index
      var correct = (question.correct.index === answer_index);

      // default opts for both outcomes
      var opts = {
        allowOutsideClick : false,
        allowEscapeKey : false,
        confirmButtonText: "下一题",
        html : true,
        confirmButtonColor: "#0096D2"
      };

      // set options for correct/incorrect
      // answer dialogue
      if (correct) {
        opts = $.extend(opts, {
          title: "正确！",
          text: "回答正确，" + (
            question.correct.text ?
            ("<div class=\"correct-text\">" +
              question.correct.text +
              "</div>"
            ) : ""),
          type: "success"
        });
      } else {
        opts = $.extend(opts, {
          title: "错误！",
          text: (
            "回答错误！<br/><br/>" +
            "正确答案是 \"" +
            question.answers[question.correct.index] + "\"." + (
            question.correct.text ?
            ("<div class=\"correct-text\">" +
              question.correct.text +
              "</div>"
            ) : "")
            ),
          type: "error"
        });
      }

      if (last_question) {
        opts.confirmButtonText = "查看测试结果";
        // 从API获取结束时间
        $.ajax({
          url: 'https://quiz-api.alanzoe.com/end_quiz',
          method: 'POST',
          success: function(data) {
            endTime = data.time;
            showResults();
          },
          error: function(error) {
            console.error('获取结束时间失败:', error);
            // 使用本地时间作为后备方案
            endTime = Math.floor(Date.now() / 1000);
            showResults();
          }
        });
      }

      // bind click event to answer button,
      // using specified sweet alert options
      ans_btn.on('click', function() {

        function next() {
          // if correct answer is selected,
          // keep track in total
          if (correct) {
            state.correct++;
          } else {
            state.wrongQuestions.push(question);
          }
          $quiz.carousel('next');

          // if we've reached the final question
          // set the results text
          if (last_question) {
            $results_title.html(resultsText(state));
            $results_ratio.text(
              "答对了 " + state.correct + "题（总计"
                + state.total + "题）"
            );
            // $twitter_link.attr('href', tweet(state, quiz_opts));
            // $facebook_link.attr('href', facebook(state, quiz_opts));
            $indicators.removeClass('show');
            // indicate the question number
            $indicators.find('li')
              .removeClass('dark')
              .eq(0)
              .addClass('dark');
          } else {
            // indicate the question number
            $indicators.find('li')
              .removeClass('dark')
              .eq(question_index+1)
              .addClass('dark');
          }
          // unbind event handler
          $('.sweet-overlay').off('click', next);
        }

        // advance to next question on OK click or
        // click of overlay
        swal(opts, next);
        $('.sweet-overlay').on('click', next);

      });

    });


  });


  // final results slide
  var $results_slide = $("<div>")
    .attr("class", "item")
    .attr("height", height + "px")
    .appendTo($slides);

  var $results_title = $('<h1>')
    .attr('class', 'quiz-title')
    .appendTo($results_slide);

  var $results_ratio = $('<div>')
    .attr('class', 'results-ratio')
    .appendTo($results_slide);

  var $restart_button = $("<div>")
    .attr("class", "quiz-answers")
    .appendTo($results_slide);

  $("<button>")
    .attr('class', 'quiz-button btn')
    .text("再来一次?")
    .click(function() {
      state.correct = 0;
      $quiz.carousel(0);
    })
    .appendTo($restart_button);

  // 新增: 添加查看错题按钮
  $("<button>")
    .attr('class', 'quiz-button btn')
    .text("查看错题")
    .click(function() {
      showWrongQuestions(state.wrongQuestions);
    })
    .appendTo($restart_button);

  $quiz.carousel({
    "interval" : false
  });

  $(window).on('resize', function() {
    $quiz.find(".item")
      .attr('height', $quiz.height() + "px");
  });

}

// 新增: 显示错误问题的函数
function showWrongQuestions(wrongQuestions) {
  var $wrongQuestionsSlide = $("<div>")
    .attr("class", "item")
    .attr("height", $quiz.height() + "px")
    .appendTo($slides);

  $("<h2>")
    .text("错题回顾")
    .appendTo($wrongQuestionsSlide);

  var $wrongQuestionsList = $("<ul>")
    .appendTo($wrongQuestionsSlide);

  $.each(wrongQuestions, function(index, question) {
    $("<li>")
      .html(question.prompt + "<br>正确答案: " + question.answers[question.correct.index])
      .appendTo($wrongQuestionsList);
  });

  $("<button>")
    .attr('class', 'quiz-button btn')
    .text("返回结果")
    .click(function() {
      $quiz.carousel('prev');
    })
    .appendTo($wrongQuestionsSlide);

  $quiz.carousel('next');
}

// 修改resultsText函数
function resultsText(state) {

  var ratio = state.correct / state.total;
  var text;

  switch (true) {
    case (ratio === 1):
      text = "Wow&mdash;满分！";
      break;
    case (ratio > 0.9):
      text = "干得不错，你答对了大部分题目！";
      break;
    case (ratio >= 0.60):
      text = "恭喜，及格啦~";
      break;
    case (ratio > 0.5):
      text = "Emmm, 至少答对一半题了...";
      break;
    case (ratio < 0.5 && ratio !== 0):
      text = "Ops! 一半都没有回答正确...";
      break;
    case (ratio === 0):
      text = "一题都没有答对，是不是该努力了？";
      break;
  }

  var duration = endTime - startTime; // 计算持续时间（秒）
  text += "<br>用时: " + duration + " 秒";

  return text;

}

// 新增: 检测控制台打开的函数
function detectDevTools() {
  if (window.console && window.console.firebug || 
      (window.outerHeight - window.innerHeight > 200) || 
      (window.outerWidth - window.innerWidth > 200)) {
    showOverlay();
  }
}

// 新增: 显示覆盖层的函数
function showOverlay() {
  var $overlay = $('<div>')
    .attr('id', 'overlay')
    .css({
      'position': 'fixed',
      'top': 0,
      'left': 0,
      'width': '100%',
      'height': '100%',
      'background-color': 'rgba(0,0,0,0.8)',
      'display': 'flex',
      'justify-content': 'center',
      'align-items': 'center',
      'z-index': 9999
    })
    .appendTo('body');

  $('<img>')
    .attr('src', '/image/hehe.jpg')
    .css({
      'max-width': '80%',
      'max-height': '80%'
    })
    .appendTo($overlay);

  $overlay.click(function() {
    $(this).remove();
  });
}

// 启动检测
setInterval(detectDevTools, 1000);

})(jQuery);

