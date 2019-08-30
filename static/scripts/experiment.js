var my_node_id;
var round = 1;
var index = 0;
var count = 0;
var folds = ['#context', '#previous', '#your-lab', '#your-choice', 'END'];

var get_info = function() {
  // Get info for node
  dallinger.getReceivedInfos(my_node_id)
    .done(function (resp) {
      var choice = resp.infos[0].contents;
      $('#loading').html('');
      $("#graphic").attr('src', '/static/images/berry-1.png');
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
    if(round == 4) {
      $("#submit-response").addClass('disabled');
      $("#submit-response").html('Sending...');

      var response = $("#classification").val();

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
        text += '<b>Your own test ' + round + ' shows that the classification is likely A, B, or C.</b>';

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
  hideSample();

    prior = '<select><option selected="selected" disabled>3</option></select>';

    $("#context").html('<p>You are a technician in the 5th shift.</p>');

    $("#previous").html('<p><b>A technician from the 4th shift, building on the work of the previous shifts, thought the classification is</b> ' + prior + '.</p>');

    $("#evidence-1").html('<b>Your own first lab test shows that the classification is likely A, B, or C.</b>');

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

      prior = '<select><option selected="selected" disabled>' + 0 + '</option></select>';

        var text = '';
        text += '<div style="display: inline" class="update"><font color="red"><b>Update!</b></font> </div>';
      text += 'A technician you ask from the 4th shift, building on the work of the previous shifts, thinks the classification is ' + prior + '. ';
      text += '<button id="hide-sample" type="button" class="btn btn-info btn-sm">HIDE</button></p>';

      $('#nextsample').show();
      $("#nextsample").html(text);

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
