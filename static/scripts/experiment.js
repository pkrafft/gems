var my_node_id;
var round = 1;
var index = 0;
var folds;

var shift;
var classes;
var tests;
var last_generation;
var samples_seen;
var decisions;
var task;

var set_bit = 0;

var get_info = function() {
  // Get info for node
  dallinger.getReceivedInfos(my_node_id)
    .done(function (resp) {

      last_generation = [];
      samples_seen = [];
      decisions = [];

      $("#nextsample").html('');
      $("#resample-text").hide();

      var last_info;
      for (var i = 0; i < resp.infos.length; i++) {
        var last_info = JSON.parse(resp.infos[i].contents);
        last_generation.push(last_info.choice);
      }

      console.log(last_generation);
      console.log(last_info);

      shift = last_info.shift + 1;
      task = last_info.task;

      if(shift == 1) {
        folds = ['#context', '#your-lab', '#your-choice', 'END'];
      } else {
        folds = ['#context', '#previous', '#your-lab', '#your-choice', 'END'];
      }

      classes = last_info.classes
      classes = shuffle(classes);

      select = document.getElementById('classification');
      for (var i = 0; i < classes.length; i++){
        var opt = document.createElement('option');
        opt.value = classes[i];
        opt.innerHTML = classes[i];
        select.appendChild(opt);
      }

      tests = last_info.tests

      $('#loading').html('');
      $("#graphic").attr('src', '/static/images/berry-' + (task + 1) + '.png');
    })
    .fail(function (rejection) {
      console.log(rejection);
      $('body').html(rejection.html);
    });
};

// Create the agent.
var create_agent = function() {
  dallinger.createAgent()
    .done(function (resp) {

      if(folds) {
        for(f of folds) {
          $(f).hide()
        }
      }

      $('#continue').html('Continue');
      $('#continue').prop('disabled', false);
      $('#continue').show()

      $("#submit-response").html('Submit');


      for (var i = 1; i <= 4; i++){
        $("#evidence-" + i + "").html('');
      }

      var select = document.getElementById('classification')
      select.options.length = 0;
      var opt = document.createElement('option');
      opt.value = '';
      opt.innerHTML = '';
      select.appendChild(opt);

      round = 1;
      index = 0;
      set_bit = 0;

      my_node_id = resp.node.id;
      get_info();
    })
    .fail(function (rejection) {
      // A 403 is our signal that it's time to go to the questionnaire
      if (rejection.status === 403) {
        dallinger.allowExit();
        dallinger.goToPage('questionnaire');
      } else {
        dallinger.error(rejection);
      }
    });
};

// Consent to the experiment.
$(document).ready(function() {

  $("#continue").click(function() {
    next();
  });


  $("#submit-response").click(function() {

    var box = document.getElementById("classification");
    var choice = box.options[box.selectedIndex].text;


    if(choice == '') {
      window.alert('Please select a value.');
      return
    }

    decisions.push([round, choice]);
    console.log(decisions);

    if(round == 4) {
      $("#submit-response").prop('disabled', true);
      $("#submit-response").html('Sending...');

      var response = JSON.stringify({'task':task, 'shift':shift, 'classes':classes, 'tests':tests, 'choice':choice, 'decisions':decisions, 'seen':samples_seen});

      $("#classification").disabled = true;

      dallinger.createInfo(my_node_id, {
        contents: response,
        info_type: 'Info'
      }).done(function (resp) {
        create_agent();
      });
    } else {

      index -= 1;
      round += 1;

      $(folds[index]).hide();

      if(round <= 4) {

        var text = '';
        text += '<div style="display: inline" class="update"><font color="red"><b>Update!</b></font> </div>';

        text += labTest();

        $("#evidence-" + round + "").html(text);

        //setTimeout(clearUpdates(), 3000)
      }

      box.options[0].selected = true;

      $('#continue').show();
      $("#continue").prop('disabled', false);
      $("#submit-response").prop('disabled', true);

    }
  });

});

var next = function() {

  clearUpdates();

    $("#context").html('<p>You are a technician in shift ' + shift + '.</p>');

    if((samples_seen.length == 0) && (shift > 1)) {

      var prior_sample = last_generation[Math.floor(Math.random()*last_generation.length)];
      var prior = '<select><option selected="selected" disabled>' + prior_sample + '</option></select>';

      $("#previous").html('<p><b>Notes from shift ' + (shift - 1) + ' indicate that another technician, building on previous shifts and using their own tests, thought the classification was</b> ' + prior + '.</p>');

      samples_seen.push([round,prior_sample]);
      console.log(samples_seen);

      $("#choice-text").show()
      $("#alt-choice-text").hide();
    }

    if(!set_bit) {
      var text = labTest();
      $("#evidence-1").html(text);
      set_bit = 1;
    }

    if(folds[index] != 'END') {
      $(folds[index]).show();
      index += 1
    }

    if (folds[index] == 'END') {
      $("#continue").prop('disabled', true);
      $('#continue').hide();
      $("#submit-response").prop('disabled', false);
    }
}

var resample = function() {

      $("#previous").hide();

      $("#choice-text").hide()
      $("#alt-choice-text").show();
      $("#resample-text").hide()

      var prior_sample = last_generation[Math.floor(Math.random()*last_generation.length)];
      var prior = '<select><option selected="selected" disabled>' + prior_sample + '</option></select>';

        var text = '';
        text += '<div style="display: inline" class="update"><font color="red"><b>Update!</b></font> </div>';
      text += 'Further notes from shift ' + (shift - 1) +  ' indicate that a technician, building on previous shifts and using their own tests, thought the classification was ' + prior + '. ';
      text += '<button id="hide-sample" type="button" class="btn btn-info btn-sm">HIDE</button></p>';

      $('#nextsample').show();
      $("#nextsample").html(text);

      samples_seen.push([round,prior_sample]);
      console.log(samples_seen);

      $("#hide-sample").click(function() {
        hideSample();
      });

      $("#hide-sample").prop('disabled', true);
      setTimeout(function(){ $("#hide-sample").prop('disabled', false)}, 1500);

    }

var hideSample = function() {
        clearUpdates();
        $('#nextsample').hide();
        $("#resample-text").show();
}

var clearUpdates = function() {
  $('.update').hide()
  $('.update').removeClass('update')
  $('.update').show()
}

var labTest = function() {

  var these_tests = tests[shift-1][round-1]
  these_tests = shuffle(these_tests);

  var text = '';
  text += '<b>Your '
  if(shift > 1) {
    text += 'own '
  }
  if(these_tests.length > 1) {
    text += 'lab test ' + round + ' shows that the classification is likely one of</b> '
  } else if (these_tests.length == 1) {
    text += 'lab test ' + round + ' shows that the classification is likely</b> '
  } else {
    text += 'lab test ' + round + ' produced no information.</b> '
  }
  if(these_tests.length > 0) {
    for(t of these_tests) {
      text += '<font color="red">' + t + '</font>, '
    }
    text = text.slice(0, -2)
    text += '.';
  }
  return(text);
}

// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
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
