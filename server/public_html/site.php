<!DOCTYPE html>
<html>
	<head>
		<title>We Browse In Public</title>
		<meta name="description" content="Stream your browsing anonymously to start chats.">
		<link rel="stylesheet" href="../css/all.css">
		<script>
			window.SITE_URL = '<?php echo SITE_URL; ?>';
		</script>
	</head>

	<body>
		<div class="masthead">
			<div class="container">
				<h1>
					We Browse In Public
				</h1>
				<div class="masthead-description">
					<h2>Stream your browsing activity and chat</h2>
					<p>Because why the hell not, right?</p>
				</div>
				<div class="signup-login">
					<div class="signup-login-header">
						Sign up anonymously or log in
					</div>
					<form class="form-inline">
						<input type="text" class="input" placeholder="Username" name="username">
						<input type="password" class="input" placeholder="Password" name="password">
						<button type="submit" class="btn">Boom</button>
					</form>
				</div>
			</div>
		</div>
		<div class="container">
			<div class="stats clearfix">
				<span class="pull-left">
					<strong>14</strong> people are browsin'
				</span>
				<span class="pull-right">
					<strong>47</strong> links shared today
				</span>
			</div>
			<ul class="links">
				<li>
					<div class="activity">
						<a href="#">Denis</a> visited <a href="#">wikipedia.com</a> 24 seconds ago
					</div>
					<a href="#" class="link-card">
						<h2>Rats on wikipedia</h2>
						<span class="visits">32 visits today</span>
						<p>There are rats here. What are they doing here. These rats shouldn't be here. They don't belong. THEY DON'T BELONG I SAY.</p>
					</a>
				</li>
			</ul>
		</div>
	</body>
</html>