var my_node_id;
var round = 1;
var index = 0;
var count = 0;
var folds = ['previous', 'your-lab', 'your-choice', 'END'];

var get_info = function() {
  // Get info for node
  dallinger.getReceivedInfos(my_node_id)
    .done(function (resp) {
      var choice = resp.infos[0].contents;
      $('#loading').html('');
      $("#graphic").attr('src', '/static/images/berry-1.png');
      $("#stimulus").show();
      $("#response-form").hide();
      $("#finish-reading").show();
    })
    .fail(function (rejection) {
      console.log(rejection);
      $('body').html(rejection.html);
    });
};

// Create the agent.
var create_agent = function() {
  $('#finish-reading').prop('disabled', true);
  dallinger.createAgent()
    .done(function (resp) {
      $('#finish-reading').prop('disabled', false);
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

  $("#finish-reading").click(function() {

    //$("#submit-response").hide();
    $("#stimulus").hide();
    $("#response-form").show();

    $("#continue").prop('disabled', false);

    prior = '<select><option selected="selected" disabled>3</option></select>';

    $("#context").html('<p>You are a technician in the 5th shift.</p>');

    $("#previous").html('<p><b>A technician from the 4th shift, building on the work of the previous shifts, thought the classification is</b> ' + prior + '.</p>');

    $("#evidence-1").html('<b>Your own first lab test shows that the classification is likely A, B, or C.</b>');

  });

  $("#continue").click(function() {

    if (folds[index] == 'END') {

      round += 1;

      if(round <= 4) {
        $("#evidence-" + round + "").html('<b>Your own test ' + round + ' shows that the classification is likely A, B, or C.</b>');
      } else {
        $("#continue").addClass('disabled');
        //$("#submit-response").show();
        $("#submit-response").prop('disabled', false);
        //$("#submit-response").html('Submit');
      }
    } else {

      var tab = '#' + folds[index];
      $(tab).show();

      index += 1
    }

  });


  $("#submit-response").click(function() {
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
  });

});

var resample = function() {

      $("#previous").hide();

      $("#choice-text").hide()
      $("#alt-choice-text").show();
      $("#resample-text").hide()

      prior = '<select><option selected="selected" disabled>' + 0 + '</option></select>';

      var text = 'A technician you ask from the 4th shift, building on the work of the previous shifts, thinks the classification is ' + prior + '. ';
      text += '<button id="hide-sample" type="button" class="btn btn-info btn-sm">HIDE</button></p>';

      $('#nextsample').show();
      $("#nextsample").html(text);

      $("#hide-sample").click(function() {
        $('#nextsample').hide();
        $("#resample-text").show();
      });

    }
