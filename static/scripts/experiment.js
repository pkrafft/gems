var my_node_id;
var round = 1;
var index = 0;
var folds;

var shift;
var classes;
var tests;
var last_generation = [];
var samples_seen = [];
var decisions = [];

var get_info = function() {
  // Get info for node
  dallinger.getReceivedInfos(my_node_id)
    .done(function (resp) {

      // TODO: loop over all participants from last generation and get an array of decisions
      var last_info = JSON.parse(resp.infos[0].contents);

      console.log(last_info);

      shift = last_info.shift + 1;
      last_generation.push(last_info.choice);

      if(shift == 1) {
        folds = ['#context', '#your-lab', '#your-choice', 'END'];
      } else {
        folds = ['#context', '#previous', '#your-lab', '#your-choice', 'END'];
      }

      classes = last_info.classes

      select = document.getElementById('classification');
      for (var i = 0; i <= classes.length; i++){ //TODO: randomize order
        var opt = document.createElement('option');
        opt.value = classes[i];
        opt.innerHTML = classes[i];
        select.appendChild(opt);
      }

      tests = last_info.tests

      $('#loading').html('');
      $("#graphic").attr('src', '/static/images/berry-1.png'); // TODO: have 8 stimuli: vary image for each 1-8
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
      $('#continue').html('Continue');
      $('#continue').prop('disabled', false);
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
      $("#submit-response").addClass('disabled');
      $("#submit-response").html('Sending...');

      var response = JSON.stringify({'shift':shift, 'classes':classes, 'tests':tests, 'choice':choice, 'decisions':decisions, 'seen':samples_seen});

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
        text += '<b>Your '
        if(shift > 1) {
          text += 'own '
        }
        text += 'test ' + round + ' shows that the classification is likely one of ' + tests[shift-1][round-1] + '.</b>';

        $("#evidence-" + round + "").html(text);

        //setTimeout(clearUpdates(), 3000)
      }

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

    var text = '<b>Your ';
    if(shift > 1) {
      text +=  'own ';
    }
    text += 'lab test 1 shows that the classification is likely one of ' + tests[shift-1][0] + '.</b>';
    $("#evidence-1").html(text);

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
