
$('#sendMessage').on('click', function () {
	var data = {}
	data.from= 'mail@shueit.net'
        data.to= 'daniel.shue@shueit.net'
        data.subject= 'LEAD from ShueIT site'
	if ($("#messageName").val() == "") {
		alert("Please enter a Name")
	}else if($("#messageEmail").val() == "") {
		alert("Please enter a Email")
	}else if($("#messageBody").val() == "") {
		alert("Please enter a Message")
	}else{
        	data.text= `Name: ${$("#messageName").val()}, Email: ${$("#messageEmail").val()}, Message: ${$("#messageBody").val()}`,
        	data.html= `<p>Name:  ${$("#messageName").val()}</p><p>Email: ${$("#messageEmail").val()}</p><p>Message ${$("#messageBody").val()}</p>`
	
		$.post("/sendEmail", JSON.stringify(data), function (data) {
			emailSent(data)
			
		})
	}
})

function emailSent (data) {
	if (data.sent) {
		alert("Message sent, Thank you")
		$("#messageName").val("")
		$("#messageEmail").val("")
		$("#messageBody").val("")
	}
}

function recaptchaDone (data) {
        $.post("/recaptcha", data, function (data) {
                if (data.success) {
			$('#sendMessage').removeClass('hide')
		}
        })
}

function recaptchaExpired () {
	$('#sendMessage').addClass('hide')	
}

console.log('scripts')
