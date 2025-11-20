pipeline {
    agent any

    environment {
        REGISTRY = "178.18.246.166:5000"
        IMAGE_NAME = "mvoice"
        CREDS = credentials('nexus_docker_creds')
        TELEGRAM_BOT_TOKEN = credentials('telegram-bot-token')
        TELEGRAM_CHAT_ID = credentials('telegram-chat-id')
    }

    options {
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'master', url: 'https://github.com/abdinazarov7799/m-voice.git'
            }
        }

        stage('Initialize Variables') {
            steps {
                script {
                    GIT_COMMIT_MSG   = sh(script: "git log -1 --pretty=%B", returnStdout: true).trim()
                    GIT_AUTHOR       = sh(script: "git log -1 --pretty=%an", returnStdout: true).trim()
                    GIT_COMMIT_SHORT = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
                    BUILD_TIMESTAMP  = sh(script: "date '+%Y-%m-%d %H:%M:%S'", returnStdout: true).trim()

                    echo "=========================================="
                    echo "🚀 Starting Build Pipeline"
                    echo "Build #${BUILD_NUMBER}"
                    echo "Branch: master"
                    echo "Commit: ${GIT_COMMIT_SHORT}"
                    echo "Author: ${GIT_AUTHOR}"
                    echo "=========================================="
                }
            }
        }

        stage('Build Images') {
            parallel {
                stage('Build Frontend') {
                    steps {
                        script {
                            dir('frontend') {
                                sh 'docker build -t $REGISTRY/$IMAGE_NAME-frontend:latest -t $REGISTRY/$IMAGE_NAME-frontend:${BUILD_NUMBER} .'
                            }
                        }
                    }
                }

                stage('Build Backend') {
                    steps {
                        script {
                            dir('backend') {
                                sh 'docker build -t $REGISTRY/$IMAGE_NAME-backend:latest -t $REGISTRY/$IMAGE_NAME-backend:${BUILD_NUMBER} .'
                            }
                        }
                    }
                }
            }
        }

        stage('Registry Login') {
            steps {
                sh """
                echo "$CREDS_PSW" | docker login $REGISTRY \
                --username "$CREDS_USR" --password-stdin
                """
            }
        }

        stage('Push Images') {
            parallel {
                stage('Push Frontend') {
                    steps {
                        sh "docker push $REGISTRY/$IMAGE_NAME-frontend:latest"
                        sh "docker push $REGISTRY/$IMAGE_NAME-frontend:${BUILD_NUMBER}"
                    }
                }

                stage('Push Backend') {
                    steps {
                        sh "docker push $REGISTRY/$IMAGE_NAME-backend:latest"
                        sh "docker push $REGISTRY/$IMAGE_NAME-backend:${BUILD_NUMBER}"
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    sshagent(['server2-ssh']) {
                        sh """
                        ssh -o StrictHostKeyChecking=no root@207.180.226.93 '
                            cd /root/m-voice &&
                            echo ${CREDS_PSW} | docker login ${REGISTRY} \
                                --username ${CREDS_USR} --password-stdin &&
                            docker compose pull &&
                            docker compose up -d &&
                            docker image prune -f
                        '
                        """
                    }
                }
            }
        }

        stage('Cleanup') {
            steps {
                sh "docker image prune -f || true"
            }
        }
    }

    post {
        success {
            script {
                def changelog = getChangeLog()
                sendTelegramMessage("""
✅ *Build Successful*

🏷 *Project:* m-voice
🔢 *Build:* #${BUILD_NUMBER}
🌿 *Branch:* master
📝 *Commit:* ${GIT_COMMIT_SHORT}
👤 *Author:* ${GIT_AUTHOR}
🗓 *Time:* ${BUILD_TIMESTAMP}

📋 *Changes:*
${changelog}

💬 *Last Commit:*
${GIT_COMMIT_MSG}

🔗 ${BUILD_URL}
🔥 Deployed to production server
""")
            }
        }

        failure {
            script {
                sendTelegramMessage("""
❌ *Build Failed*

Build #${BUILD_NUMBER}
Commit: ${GIT_COMMIT_SHORT}
Author: ${GIT_AUTHOR}

🔗 ${BUILD_URL}console
""")
            }
        }

        always {
            sh "docker logout $REGISTRY || true"
        }
    }
}

def getChangeLog() {
    def sets = currentBuild.changeSets
    def log = ""

    for (cs in sets) {
        for (entry in cs.items) {
            log += "• ${entry.msg} — _${entry.author}_\n"
        }
    }

    return log ?: "No changes"
}

def sendTelegramMessage(String msg) {
    sh """
    curl -s -X POST https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage \
    -d chat_id=${TELEGRAM_CHAT_ID} \
    -d parse_mode=Markdown \
    -d text="${msg.replace('"', '\\"').replace('`', '\\`')}"
    """
}
