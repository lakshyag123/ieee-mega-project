$(".btn").hover(function(){
    $(this).css("background-color", "#21C9A6");
    }, function(){
    $(this).css("background-color", "#4c74b9");
  });
  $("#x").hover(function(){
    $(this).css("background-color", "#1FBADE");
    }, function(){
    $(this).css("background-color", "#4c74b9");
  });
  $(".btn-squared-default").hover(function(){
    $(this).css("background-color", "#32E08A");
    }, function(){
    $(this).css("background-color", "#4c74b9");
  });
  $(".but").hover(function(){
    $(this).css("background-color","#1FBADE");
    }, function(){
    $(this).css("background-color", "white");
  });
  $(".btn-secondary").hover(function(){
    $(this).css("background-color", "#1FBADE");
    }, function(){
    $(this).css("background-color", " #142034");
  });
//  hide
// $("#hideout").click(function(){
//   $("#hidedrop").fadeToggle();
// });


$("#hide").click(function(){
    $("#hidedrop2").hide();$("#hidedrop3").hide();$("#hidedrop4").hide();$("#hidedrop5").hide();
  
});
$("#hideme").hover(function(){

  $("#hidedrop2").show();
  $("#hidedrop3").show();
  $("#hidedrop4").show();
  $("#hidedrop5").show();
});
$("#hide").hover(function(){
  $("#hidedrop2").hide();$("#hidedrop3").hide();$("#hidedrop4").hide();$("#hidedrop5").hide();

});
 