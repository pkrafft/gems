var my_node_id;

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
    $("#stimulus").hide();
    $("#response-form").show();
    prior = '<select><option selected="selected" disabled>3</option></select>';
    $("#previous").html('<p>You are a technician in the 5th shift.</p><p><b>A technician from the 4th shift, building on the work of the previous shifts, thought the classification is</b> ' + prior + '.</p>');
    $("#evidence").html('<b>Your own first lab test shows that the classification is likely A, B, or C.</b>');
    $("#more").html('<p><b>To see the opinion of another technician from the 4th shift click: </b><button id="resample" type="button" class="btn btn-info">Here</button></p>')
    $("#submit-response").removeClass('disabled');
    $("#submit-response").html('Submit');
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
