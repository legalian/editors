from flask import Flask, render_template
app = Flask(__name__)



@app.route('/')
def home():
	return render_template('home.html')

@app.route('/animation')
def animation():
	return render_template('animationeditor.html')

@app.route('/music')
def music():
	return render_template('grapheditor.html')


if __name__ == '__main__':
    app.run()

