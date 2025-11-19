pipeline {
    agent any

    environment {
        REGISTRY = "178.18.246.166:5000"
        IMAGE_NAME = "mvoice"
        CREDS = credentials('nexus_docker_creds')
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'master', url: 'https://github.com/abdinazarov7799/m-voice.git'
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'docker build -t $REGISTRY/$IMAGE_NAME-frontend:latest .'
                }
            }
        }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    sh 'docker build -t $REGISTRY/$IMAGE_NAME-backend:latest .'
                }
            }
        }

        stage('Login to Nexus Registry') {
            steps {
                sh "echo $CREDS_PSW | docker login $REGISTRY --username $CREDS_USR --password-stdin"
            }
        }

        stage('Push Images') {
            steps {
                sh "docker push $REGISTRY/$IMAGE_NAME-frontend:latest"
                sh "docker push $REGISTRY/$IMAGE_NAME-backend:latest"
            }
        }

        stage('Deploy to Server 2') {
            steps {
                sshagent(['server2-ssh']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no root@207.180.226.93 '
                            cd /root/m-voice &&
                            docker compose pull &&
                            docker compose up -d
                        '
                    """
                }
            }
        }
    }

    post {
        success {
            echo "Build & Push successful!"
        }
        failure {
            echo "Build failed!"
        }
    }
}
