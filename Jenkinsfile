pipeline {
    agent any

    environment {
        REGISTRY = "178.18.246.166:5000"
        IMAGE_NAME = "mvoice"
        CREDS = credentials('nexus_docker_creds')
        TELEGRAM_BOT_TOKEN = credentials('telegram-bot-token')
        TELEGRAM_CHAT_ID = credentials('telegram-chat-id')
        GIT_COMMIT_MSG = sh(script: "git log -1 --pretty=%B", returnStdout: true).trim()
        GIT_AUTHOR = sh(script: "git log -1 --pretty=%an", returnStdout: true).trim()
        GIT_COMMIT_SHORT = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
        BUILD_TIMESTAMP = sh(script: "date '+%Y-%m-%d %H:%M:%S'", returnStdout: true).trim()
    }

    options {
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
    }

    stages {
        stage('📋 Initialization') {
            steps {
                script {
                    echo "=========================================="
                    echo "🚀 Starting Build Pipeline"
                    echo "Build #${BUILD_NUMBER}"
                    echo "Branch: master"
                    echo "Commit: ${GIT_COMMIT_SHORT}"
                    echo "=========================================="
                }
            }
        }

        stage('🔍 Checkout') {
            steps {
                script {
                    echo "Cloning repository..."
                    git branch: 'master', url: 'https://github.com/abdinazarov7799/m-voice.git'
                    echo "✅ Repository cloned successfully"
                }
            }
        }

        stage('🏗️ Build Images') {
            parallel {
                stage('Build Frontend') {
                    steps {
                        script {
                            echo "Building Frontend Docker image..."
                            dir('frontend') {
                                sh 'docker build -t $REGISTRY/$IMAGE_NAME-frontend:latest -t $REGISTRY/$IMAGE_NAME-frontend:${BUILD_NUMBER} .'
                            }
                            echo "✅ Frontend image built successfully"
                        }
                    }
                }
                stage('Build Backend') {
                    steps {
                        script {
                            echo "Building Backend Docker image..."
                            dir('backend') {
                                sh 'docker build -t $REGISTRY/$IMAGE_NAME-backend:latest -t $REGISTRY/$IMAGE_NAME-backend:${BUILD_NUMBER} .'
                            }
                            echo "✅ Backend image built successfully"
                        }
                    }
                }
            }
        }

        stage('🔐 Registry Login') {
            steps {
                script {
                    echo "Logging into Nexus Registry..."
                    sh "echo $CREDS_PSW | docker login $REGISTRY --username $CREDS_USR --password-stdin"
                    echo "✅ Logged in successfully"
                }
            }
        }

        stage('📤 Push Images') {
            parallel {
                stage('Push Frontend') {
                    steps {
                        script {
                            echo "Pushing Frontend images..."
                            sh "docker push $REGISTRY/$IMAGE_NAME-frontend:latest"
                            sh "docker push $REGISTRY/$IMAGE_NAME-frontend:${BUILD_NUMBER}"
                            echo "✅ Frontend images pushed"
                        }
                    }
                }
                stage('Push Backend') {
                    steps {
                        script {
                            echo "Pushing Backend images..."
                            sh "docker push $REGISTRY/$IMAGE_NAME-backend:latest"
                            sh "docker push $REGISTRY/$IMAGE_NAME-backend:${BUILD_NUMBER}"
                            echo "✅ Backend images pushed"
                        }
                    }
                }
            }
        }

        stage('🚀 Deploy') {
            steps {
                script {
                    echo "Deploying to production server..."
                    sshagent(['server2-ssh']) {
                        sh """
                            ssh -o StrictHostKeyChecking=no root@207.180.226.93 '
                                cd /root/m-voice &&
                                echo "Pulling latest images..." &&
                                docker compose pull &&
                                echo "Restarting services..." &&
                                docker compose up -d &&
                                echo "Cleaning up old images..." &&
                                docker image prune -f
                            '
                        """
                    }
                    echo "✅ Deployment completed successfully"
                }
            }
        }

        stage('🧹 Cleanup') {
            steps {
                script {
                    echo "Cleaning up local Docker images..."
                    sh """
                        docker image prune -f || true
                    """
                    echo "✅ Cleanup completed"
                }
            }
        }
    }

    post {
        success {
            script {
                def changelog = getChangeLog()
                def message = """
✅ *Build Successful* ✅

🏷 *Project:* m-voice
🔢 *Build:* #${BUILD_NUMBER}
🌿 *Branch:* master
📝 *Commit:* `${GIT_COMMIT_SHORT}`
👤 *Author:* ${GIT_AUTHOR}
⏱ *Time:* ${BUILD_TIMESTAMP}
⏳ *Duration:* ${currentBuild.durationString.replace(' and counting', '')}

📋 *Changes:*
${changelog}

💬 *Last Commit:*
${GIT_COMMIT_MSG}

🔗 [View Build](${BUILD_URL})
🚀 *Status:* Deployed to Production
                """.stripIndent()

                sendTelegramMessage(message)
                echo "=========================================="
                echo "✅ BUILD & DEPLOYMENT SUCCESSFUL!"
                echo "=========================================="
            }
        }
        failure {
            script {
                def message = """
❌ *Build Failed* ❌

🏷 *Project:* m-voice
🔢 *Build:* #${BUILD_NUMBER}
🌿 *Branch:* master
📝 *Commit:* `${GIT_COMMIT_SHORT}`
👤 *Author:* ${GIT_AUTHOR}
⏱ *Time:* ${BUILD_TIMESTAMP}
⏳ *Duration:* ${currentBuild.durationString.replace(' and counting', '')}

💬 *Last Commit:*
${GIT_COMMIT_MSG}

🔗 [View Build](${BUILD_URL})
📊 [Console Output](${BUILD_URL}console)

⚠️ *Please check the logs for details*
                """.stripIndent()

                sendTelegramMessage(message)
                echo "=========================================="
                echo "❌ BUILD FAILED!"
                echo "=========================================="
            }
        }
        unstable {
            script {
                def message = """
⚠️ *Build Unstable* ⚠️

🏷 *Project:* m-voice
🔢 *Build:* #${BUILD_NUMBER}
🌿 *Branch:* master
📝 *Commit:* `${GIT_COMMIT_SHORT}`
👤 *Author:* ${GIT_AUTHOR}

🔗 [View Build](${BUILD_URL})
                """.stripIndent()

                sendTelegramMessage(message)
            }
        }
        always {
            script {
                echo "Logging out from Docker registry..."
                sh "docker logout $REGISTRY || true"
            }
        }
    }
}

def getChangeLog() {
    def changeLogSets = currentBuild.changeSets
    def changeLog = ""

    if (changeLogSets.size() == 0) {
        return "No changes"
    }

    def maxChanges = 5
    def count = 0

    for (int i = 0; i < changeLogSets.size(); i++) {
        def entries = changeLogSets[i].items
        for (int j = 0; j < entries.length && count < maxChanges; j++) {
            def entry = entries[j]
            changeLog += "  • ${entry.msg} - _${entry.author}_\n"
            count++
        }
    }

    if (changeLogSets.size() > maxChanges) {
        changeLog += "  • ... and more changes\n"
    }

    return changeLog ?: "No changes"
}

def sendTelegramMessage(String message) {
    sh """
        curl -s -X POST https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage \
        -d chat_id=${TELEGRAM_CHAT_ID} \
        -d parse_mode=Markdown \
        -d text="${message.replace('"', '\\"').replace('`', '\\`')}"
    """
}