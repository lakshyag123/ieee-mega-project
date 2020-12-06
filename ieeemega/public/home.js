//login/signup tabs
$( function() {
  $( "#tabs" ).tabs();
} );
// Detect request animation frame
var scroll = window.requestAnimationFrame ||
function(callback){ window.setTimeout(callback, 1000/60)};
var elementsToShow = document.querySelectorAll('.show-on-scroll'); 
function loop() {
    Array.prototype.forEach.call(elementsToShow, function(element){
      if (isElementInViewport(element)) {
        element.classList.add('is-visible');
      } else {
        element.classList.remove('is-visible');
      }
    });

    scroll(loop);
}
loop();
function isElementInViewport(el) {
  if (typeof jQuery === "function" && el instanceof jQuery) {
    el = el[0];
  }
  var rect = el.getBoundingClientRect();
  return (
    (rect.top <= 0
      && rect.bottom >= 0)
    ||
    (rect.bottom >= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.top <= (window.innerHeight || document.documentElement.clientHeight))
    ||
    (rect.top >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight))
  );
}
var w=$(window).width();

  if(w>700)
  {
    var a=true;
    $("#ll").hover(function(){
    if(a==false){
    $("#ll").css({"height":"25px","width":"25px"});
    a=true;
    }
    else{
      $("#ll").css({"height":"28px","width":"28px"});
      a=false;
    }
 
    });
    $("#tl").hover(function(){
      if(a==false){
        $("#tl").css({"height":"25px","width":"25px"});
        a=true;
      }
      else{
        $("#tl").css({"height":"28px","width":"28px"});
        a=false;
      }
    });
    $("#gl").hover(function(){
      if(a==false){
        $("#gl").css({"height":"25px","width":"25px"});
        a=true;
      }
      else{
        $("#gl").css({"height":"28px","width":"28px"});
        a=false;
      }
     
    });
    $("#fl").hover(function(){
      if(a==false){
        $("#fl").css({"height":"25px","width":"25px"});
        a=true;
      }
      else{
        $("#fl").css({"height":"28px","width":"28px"});
        a=false;
      }
     
    });
    $("#il").hover(function(){
      if(a==false){
        $("#il").css({"height":"25px","width":"25px"});
        a=true;
      }
      else{
        $("#il").css({"height":"28px","width":"28px"});
        a=false;
      }
     
    });
    $("#l1").hover(function(){
      if(a==false){
        $("#l1").css({"height":"25px","width":"25px"});
        a=true;
      }
      else{
        $("#l1").css({"height":"28px","width":"28px"});
        a=false;
      }
    });
    $("#l2").hover(function(){
      if(a==false){
        $("#l2").css({"height":"25px","width":"25px"});
        a=true;
      }
      else{
        $("#l2").css({"height":"28px","width":"28px"});
        a=false;
      }
    });
    $("#l3").hover(function(){
      if(a==false){
        $("#l3").css({"height":"25px","width":"25px"});
        a=true;
      }
      else{
        $("#l3").css({"height":"28px","width":"28px"});
        a=false;
      }
    });
    $("#l4").hover(function(){
      if(a==false){
        $("#l4").css({"height":"25px","width":"25px"});
        a=true;
      }
      else{
        $("#l4").css({"height":"28px","width":"28px"});
        a=false;
      }
    });
    $("#l5").hover(function(){
      if(a==false){
        $("#l5").css({"height":"25px","width":"25px"});
        a=true;
      }
      else{
        $("#l5").css({"height":"28px","width":"28px"});
        a=false;
      }
    });
    $("#l6").hover(function(){
      if(a==false){
        $("#l6").css({"height":"25px","width":"25px"});
        a=true;
      }
      else{
        $("#l6").css({"height":"28px","width":"28px"});
        a=false;
      }
    });
    $("#l7").hover(function(){
      if(a==false){
        $("#l7").css({"height":"25px","width":"25px"});
        a=true;
      }
      else{
        $("#l7").css({"height":"28px","width":"28px"});
        a=false;
      }
    });
    $("#l8").hover(function(){
      if(a==false){
        $("#l8").css({"height":"25px","width":"25px"});
        a=true;
      }
      else{
        $("#l8").css({"height":"28px","width":"28px"});
        a=false;
      }
    });
    $("#l9").hover(function(){
      if(a==false){
        $("#l9").css({"height":"25px","width":"25px"});
        a=true;
      }
      else{
        $("#l9").css({"height":"28px","width":"28px"});
        a=false;
      }
    });
    $("#l10").hover(function(){
      if(a==false){
        $("#l10").css({"height":"25px","width":"25px"});
        a=true;
      }
      else{
        $("#l10").css({"height":"28px","width":"28px"});
        a=false;
      }
    });
  }
