// Visuals

function setup() {
    createCanvas(windowWidth, windowHeight);
}

const pointRadius = 20
const
    textPrompt = document.getElementById('explanation'),
    demoButton = document.getElementById('demo')
const displayText = (text) => textPrompt.innerText = text
const buttonText = (text) => demoButton.innerText = text

let isInteractive = true
function drawInteractive() {
    // Enable mouse interactions
    
    drawRoutine = () => {
        background(0)
        drawDefault()
        for(const p of closestPair) {
            fill(0, 255, 0)
            circle(p.x, p.y, pointRadius)
        }
    }
    
    isInteractive = true
    demoButton.onclick = startDemo
    displayText('Click to add points. Green points are a closest pair.')
    buttonText('Explain')
}

function drawDefault() {
    for(const p of points) {
        fill(255, 255, 255)
        circle(p.x, p.y, pointRadius/2)
    }
}

function drawSorted(sortedPoints) {
    drawRoutine = () => {
        background(0)
        drawDefault()
        
        
        textAlign(LEFT, BOTTOM)
        textSize(32)
        noStroke()
        fill(0, 255, 0)
        for(const [i, p] of sortedPoints.entries()) {
            text(i, p.x, p.y)
        }
    }
}

function drawPartition(medianX, partitionPoints) {
    drawRoutine = () => {
        background(0)
        drawDefault()
        
        strokeWeight(2)
        stroke(255, 0, 0)
        line(medianX, 0, medianX, windowHeight)

        noStroke()

        fill(0, 255, 0)

        for(const p of partitionPoints) {
            circle(p.x, p.y, pointRadius)
        }
    }
}

function drawClosest(pairs) {
    drawRoutine = () => {
        background(0)
        drawDefault()

        
        strokeWeight(3)
        stroke(255, 128, 0)
        for(const pair of pairs) {
            beginShape(LINES)

            fill(0, 255, 0)
            for(const p of pair) {
                vertex(p.x, p.y)
                circle(p.x, p.y, pointRadius)
            }
            // noFill()
            endShape()
        }
        noStroke()
    }
}

function drawStrip(stripWidth, median, closestPair, pointA, otherPoints) {
    drawRoutine = () => {
        background(0)
        noStroke()
        fill(0, 0, 255, 128)
        rect(median-stripWidth, 0, 2*stripWidth, windowHeight)
        drawDefault()


        strokeWeight(1)
        fill(0, 255, 0)
        stroke(255, 128, 0)
        for(const pointB of otherPoints) {
            beginShape(LINES)
            line(pointA.x, pointA.y, pointB.x, pointB.y)
        }
        
        strokeWeight(3)
        stroke(0, 255, 0)
        beginShape(LINES)
        for(const p of closestPair) {
            vertex(p.x, p.y)
            circle(p.x, p.y, pointRadius)
        }
        endShape()
    }
}

drawInteractive()
function draw() {
    drawRoutine()
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}


// Algorithm
let points = []

function mouseClicked() {
    if(!isInteractive) return
    points.push(Point(mouseX, mouseY))
    setPoints()
}

async function setPoints() {
    closestPair = await closestPoints(points, false)
    console.log(`Closest pair ${closestPair}`)
}

let closestPair = []

function Point(x, y) {
    return {x, y}
}

const compareX = (p1, p2) => p1.x - p2.x
const compareY = (p1, p2) => p1.y - p2.y

function sortByXY(points) {
    let byX = points.slice()
    let byY = points.slice()

    byX.sort(compareX)
    byY.sort(compareY)

    return [byX, byY]
}

function parition(medianX, points, leftPartion, rightPartition) {
    for (const point of points) {
        let x = point.x
        if (x < medianX) {
            leftPartion.push(point)
        } else if (x > medianX) {
            rightPartition.push(point)
        }
        // Ignore points along median to avoid infinite recursion
    }
}

function distance(a, b) {
    let
        x = a.x - b.x,
        y = a.y - b.y
    return Math.sqrt(x*x + y*y)
}

async function closestPoints(points, isDemo) {
    async function recursive(byX, byY, isDemo) {
        const n = byX.length
        // No closest points; base case
        if (n == 0) {
            return [[], Infinity]
        }
        
        // Find median X value; O(1)
        let mid = Math.floor(n/2)
        const medianX = byX[mid].x

        // Partition into left and right sides, maintaining sorting; O(n) time
        const
            leftByX = [],
            rightByX = [],
            leftByY = [],
            rightByY = []

        parition(medianX, byX, leftByX, rightByX)
        parition(medianX, byY, leftByY, rightByY)
        if (isDemo) {
            displayText('Find the median X value...')
            drawPartition(medianX, [])
            await waitForUserInput()

            displayText('and separate the points into a left partition...')
            drawPartition(medianX, leftByX)
            await waitForUserInput()

            displayText('and a right partition.')
            drawPartition(medianX, rightByX)
            await waitForUserInput()
        }

        // Solve problem on both partitions; 2T(n/2)
        let [pairLeft, distLeft] = await recursive(leftByX, leftByY, false)
        let [pairRight, distRight] = await recursive(rightByX, rightByY, false)
        if (isDemo) {
            displayText('Find the closest pair on the left, by recursion...')
            drawClosest([pairLeft])
            await waitForUserInput()

            displayText('and the closest pair on the right.')
            drawClosest([pairLeft, pairRight])
            await waitForUserInput()
        }

        let minDist, closestPair
        if (distLeft < distRight) {
            minDist = distLeft
            closestPair = pairLeft
        } else {
            minDist = distRight
            closestPair = pairRight
        }

        let strip = []
        let stripWidth = minDist
        for (let point of byY) {
            if (Math.abs(point.x - medianX) < stripWidth)
                strip.push(point)
        }

        // Construct center strip to check pairs that would cross over median
        if (isDemo) {
            displayText('To check for a closest pair that might cross the median...')
            await waitForUserInput()
            
            displayText('construct a strip along the median x of width 2*closest distance..')
            drawStrip(stripWidth, medianX, closestPair, null, [])
            await waitForUserInput()

            displayText('And iterate through the strip by increasing Y-coordinate, checking each point against the next 7')
            // drawStrip(minDist, medianX)
            await waitForUserInput()
        }
        

        // Check points in strip. Need to only check the next
        let stripSize = strip.length
        let pointsToCheck = 8
        for (let i = 0; i < stripSize; i++) {
            let pointA = strip[i]
            let lastPointIndex = Math.min(i+pointsToCheck, stripSize-1)

            let otherPoints = []
            for (let j = i+1; j <= lastPointIndex; j++) {
                let pointB = strip[j]
                let dist = distance(pointA, pointB)
                
                if (dist < minDist) {
                    minDist = dist
                    closestPair = [pointA, pointB]
                }

                if (isDemo) {
                    otherPoints.push(pointB)
                }
            }

            if(isDemo) {
                drawStrip(stripWidth, medianX, closestPair, pointA, otherPoints)
                await waitForUserInput()
            }
        }

        if (isDemo) {
            displayText('At the end, we have the closest pair of points in the set')
            drawClosest([closestPair])
            await waitForUserInput()
        }

        return [closestPair, minDist]
    }

    let [X, Y] = sortByXY(points)
    if(isDemo) {
        displayText("First sort the input points along the X-axis...")
        drawSorted(X)
        await waitForUserInput()

        displayText("And the Y-axis")
        drawSorted(Y)
        await waitForUserInput()
    }

    let [closestPair, _] = await recursive(X, Y, isDemo)
    
    return closestPair
}


// user input
let nextInput = false
async function timeout(ms) {
    return new Promise(res => setTimeout(res, ms))
}
async function waitForUserInput() {
    while(!nextInput) await timeout(50)
    nextInput = false
}

async function startDemo() {
    // Setup
    isInteractive = false
    buttonText("Next")
    demoButton.onclick = nextSlide

    // Algorithm
    await closestPoints(points, true)

    // Clean up
    drawInteractive()
}

function nextSlide() {
    nextInput = true
}