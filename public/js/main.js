(function($) {

	"use strict";

	var fullHeight = function() {

		$('.js-fullheight').css('height', $(window).height());
		$(window).resize(function(){
			$('.js-fullheight').css('height', $(window).height());
		});

	};
	fullHeight();

	$('#sidebarCollapse').on('click', function () {
      $('#sidebar').toggleClass('active');
  });

})(jQuery);


//--------------------Dynamic chat app script---------------

function getCookie(name) {
	let matches = document.cookie.match(new RegExp(
		"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
	));
	return matches ? decodeURIComponent(matches[1]) : undefined;
}


var userData = JSON.parse(getCookie('user'));
console.log('Cookie Data', userData);
console.log(getCookie('user'));


var sender_id = '' ;
var receiver_id;

var socket =io('/user-namespace',{
  auth:{
	token: ''
  }
});


$(document).ready(function(){
  $('.user-list').click(function(){

	var userId = $(this).attr('data-id');
	receiver_id = userId;
	$('.start-head').hide();
	$('.chat-section').show();

	socket.emit('existsChat',{sender_id:sender_id,receiver_id:receiver_id});
  });


});

socket.on('getOnlineUser',function(data){
  $('#'+data.user_id+'-status').text('Online');
  $('#'+data.user_id+'-status').removeClass('offline-status');
  $('#'+data.user_id+'-status').addClass('online-status');
});


socket.on('getOfflineUser',function(data){
  $('#'+data.user_id+'-status').text('Offline');
  $('#'+data.user_id+'-status').addClass('offline-status');
  $('#'+data.user_id+'-status').removeClass('online-status');
});

//chat save of user
 $('#chat-form').submit(function(event){
  event.preventDefault();
  var message = $('#message').val();

  $.ajax({
	url:'/save-chat',
	type:'POST',
	data:{sender_id:sender_id, receiver_id:receiver_id, message:message},
	success:function(response){
	  if(response.success){
		console.log(response.data.message);
		$('#message').val('');
		let chat = response.data.message;
		let html = `
		<div class="current-user-chat" id='`+response.data._id+`'>
			  <h5><span class="chatmsg">`+chat+`</span>
				<span onclick="Remove()"> <i class="fa fa-trash" aria-hidden="true"  data-id='`+response.data._id+`' ></i></span>
				  <span onclick="emove()"> <i class="fa fa-edit" aria-hidden="true"  data-id='`+response.data._id+`' data-msg='`+chat+`' ></i></span>
				</h5>

		</div>
		`;
	   $('#chat-container').append(html);
	   socket.emit('newChat',response.data);

	   scrollChat();
			


	  }
	  else{
		alert(data.msg);
	  }

	}
  });
 });

 socket.on('loadNewChat',function(data){
  if(sender_id == data.receiver_id && receiver_id== data.sender_id){
	let html = `
			 <div class="distance-user-chat" id='`+data._id+`'>
			<h5>`+data.message+`</h5>

			</div>
			 `;
   $('#chat-container').append(html);



  }
  scrollChat();
  
 });

 //load old chats

 socket.on('loadChats', function(data){
  $('#chat-container').html('');

  var chats = data.chats;
  let html = '';
  for(let x =0; x< chats.length; x++){
	let addClass = '';
	if(chats[x]['sender_id']== sender_id){
	  addClass = 'current-user-chat';
	}
	else{
	  addClass = 'distance-user-chat';     
	}

	html += `
			 <div class='`+addClass+`' id='`+chats[x]['_id']+`'>
			<h5><span class="chatmsg">`+chats[x]['message']+`</span>`;
			  if(chats[x]['sender_id']== sender_id){
				html+=`<span onclick="Remove()"> <i class="fa fa-trash" aria-hidden="true"  data-id='`+chats[x]['_id']+`' ></i>
				  <span onclick="emove()"> <i class="fa fa-edit" aria-hidden="true"  data-id='`+chats[x]['_id']+`' data-msg='`+chats[x]['message']+`' ></i></span>
				  </span>
				  
				  `;
	  
				}
				html+=`

			  
			  </h5>

			</div>
			 `;
  }
  $('#chat-container').append(html);

  scrollChat();
 });

 function scrollChat(){
  $('#chat-container').animate({
	scrollTop:$('#chat-container').offset().top + $('#chat-container')[0].scrollHeight
  },0);

 }
 let popup = document.getElementById("deleteChatModal");
 let pop = document.getElementById("editChatModal");

 function Remove(){
	  popup.classList.add("mod-popup");
	  //pop.classList.add("mod-popup");
 }
 function emove(){
	  pop.classList.add("mo-popup");
	  //pop.classList.add("mod-popup");
 }
 function close(){
  popup.classList.remove("mod-popup");
 }

 

 $(document).on('click','.fa-trash', function(){
  $('.mod').removeClass('hidden');
  
  

 
  let msg = $(this).parent().parent().text();
  $('#delete-message').text(msg);
  $('#delete-message-id').val($(this).attr('data-id'));
 });

 $(document).on('click','.btn-secondary', function(){
  $('.mod').addClass('hidden');

 });
 $(document).on('click','.btn-secondary', function(){
  $('.mo').addClass('hidden');

 });
 

 $('#delete-chat-form').submit(function(event){
  event.preventDefault();

  var id=$('#delete-message-id').val();

  $.ajax({
	url:'/delete-chat',
	type:'POST',
	data:{id:id},
	success:function(res){
	  if(res.success == true){
		$('#'+id).remove();
		$('#deleteChatModal').addClass('hidden');
		socket.emit('chatDeleted', id);

		
	  }
	  else{
		
		alert(res.msg);
	  }
	}
  })
 });


 socket.on('chatMessageDeleted', function(id){
  $('#'+id).remove();
 });

 
//update user chat
$(document).on('click','.fa-edit',function(){
  $('.mo').removeClass('hidden');
  $('#edit-message-id').val($(this).attr('data-id'));
  $('#update-message').val($(this).attr('data-msg'));
});


$('#update-chat-form').submit(function(event){
  event.preventDefault();

  var id=$('#edit-message-id').val();
  var msg=$('#update-message').val();

  $.ajax({
	url:'/update-chat',
	type:'POST',
	data:{id:id, message:msg},
	success:function(res){
	  if(res.success == true){
		
		$('#editChatModal').addClass('hidden');
		$('#'+id).find('.chatmsg').text(msg);
		$('#'+id).find('.fa-edit').attr('data-msg',msg);

		socket.emit('chatUpdated', {id:id, message:msg});

		
	  }
	  else{
		
		alert(res.msg);
	  }
	}
  })
 });
 

 socket.on('chatMessageUpdated', function(data){
  $('#'+data.id).find('h5').text(data.message);
 })



