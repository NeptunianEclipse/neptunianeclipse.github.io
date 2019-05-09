const baseTime = new Date(2019, 4, 3, 0, 0, 0, 0);
const planetSpacing = 42;
const sunSpacing = 15;
const radiusScale = 0.0005;
const sizeFudging = 0.5;

const sliderSensitivty = 100000000;

let planetsContainer;

// Time in days, distance in km


// 2019 123rd day: 3 May 2019 00:00:00 NZST


class PlanetsRenderer {

    constructor() {
        this.planets = [
            new Planet(0, 'Sun',        0.1,      150000,0),
            new Planet(1, 'Mercury',    88,     4879,   327.42),
            new Planet(2, 'Venus',      224.7,  12104,  335.32),
            new Planet(3, 'Earth',      365.2,  12756,  222.27),
            new Planet(4, 'Mars',       687,    6792,   105.07),
            new Planet(5, 'Jupiter',    4331,   142984, 256.44),
            new Planet(6, 'Saturn',     10747,  120536, 285.9),
            new Planet(7, 'Uranus',     30589,  51118,  33.28),
            new Planet(8, 'Neptune',    59800,  49528,  346.77)
        ];

        this.diameterMin = this.planets.map(p => p.diameter).reduce((acc, v) => Math.min(acc, v), Infinity);
        this.diameterMax = this.planets.map(p => p.diameter).reduce((acc, v) => Math.max(acc, v), 0);

        this.planetElements = [];
        this.orbitElements = [];

        this.planetsRoot = planetsContainer.getElementsByClassName('planets-root')[0];
        this.planetTime = document.getElementsByClassName('planet-time')[0];

        this.realtime = true;
        this.customTime = Date.now();
        this.customTimeRate = 0;
        this.updateDirty = true;

        this.previousFrameTime = Date.now();

        this.createElements();

        this.update();
    }
    
    createElements() {
        let time = this.timeToDays(this.getOffsetTime());
        let earthAngle = this.planets[2].getAngle(time);

        for(let planet of this.planets) {
            if(planet.planetElement != null) {
                this.planetsRoot.remove(planet.planetElement);
            }
            if(planet.orbitElement != null) {
                this.planetsRoot.remove(planet.orbitElement);
            }

            // Orbit
            let orbitElement = document.createElement('div');
            this.planetsRoot.appendChild(orbitElement);
            planet.orbitElement = orbitElement;
            orbitElement.classList.add('orbit');

            let orbitSize = planet.getDistance() * 2;
            orbitElement.style.width = orbitSize + 'px';
            orbitElement.style.height = orbitSize + 'px';

            orbitElement.style.top = (-orbitSize / 2) + 'px';
            orbitElement.style.left = (-orbitSize / 2) + 'px';
            
            // Planet
            let planetElement = document.createElement('div');
            this.planetsRoot.appendChild(planetElement);
            planet.planetElement = planetElement;

            planetElement.classList.add('planet', `planet-${planet.name}`.toLowerCase());

            let mid = (this.diameterMax - this.diameterMin) * 0.5;
            let diff = planet.diameter - mid;
            let finalDiameter = diff * sizeFudging + mid;
            planet.visualSize = finalDiameter * radiusScale;

            planetElement.style.width = planet.visualSize + 'px';
            planetElement.style.height = planet.visualSize + 'px';
        }
    }

    getOffsetTime() {
        return (this.realtime ? Date.now() : this.customTime) - baseTime;
    }

    timeToDays(time) {
        return time / (1000 * 60 * 60 * 24);
    }

    update() {
        if(this.realtime === false || this.updateDirty) {
            let deltaTime = Date.now() - this.previousFrameTime;

            this.customTime += this.customTimeRate * deltaTime * sliderSensitivty;
            let time = this.timeToDays(this.getOffsetTime());

            for(let planet of this.planets) {
                let planetElement = planet.planetElement;

                // Position
                let position = planet.getPosition(time, 0);
                planetElement.style.top = (position.x - planet.visualSize / 2) + 'px';
                planetElement.style.left = (position.y - planet.visualSize / 2) + 'px';
                
                // Box shadow
                let planetAngle = planet.getAngle(time) - 0;
                let radiansAngle = planetAngle * (Math.PI / 180);
                let shadowX = -Math.cos(radiansAngle) * planet.visualSize / 2.5;
                let shadowY = -Math.sin(radiansAngle) * planet.visualSize / 2.5;
                planetElement.style.boxShadow = `${shadowX}px ${shadowY}px 0 inset rgba(0, 0, 0, 0.5)`;
            }
            
            let shownTime = new Date(0);
            shownTime.setUTCMilliseconds(this.realtime ? Date.now() : this.customTime);
            let day = shownTime.getDate().toString().padStart(2, '0');
            let month = shownTime.getMonth().toString().padStart(2, '0');
            let year = shownTime.getFullYear().toString().padStart(4, '0');

            this.planetTime.innerHTML = `${day}/${month}/${year}`;

            this.updateDirty = false;
        }

        this.previousFrameTime = Date.now();
        window.requestAnimationFrame(this.update.bind(this));
    }

}

class Planet {

    constructor(index, name, orbitalPeriod, diameter, baseRightAscension) {
        this.index = index;
        this.name = name;
        this.orbitalPeriod = orbitalPeriod;
        this.diameter = diameter;
        this.baseRightAscension = baseRightAscension;

        this.visualSize = 0;
        this.planetElement = null;
        this.orbitElement = null;
    }

    getHTML() {
        return planetHTML.replace("{name}", this.name);
    }

    getDistance() {
        let distance = this.index * planetSpacing;
        if(this.index > 0) {
            distance += sunSpacing;
        }
        return distance;
    }

    getAngle(time) {
        let angle = (this.baseRightAscension + (time / this.orbitalPeriod) * 360) % 360;
        if(angle < 0) {
            angle += 360;
        }

        return angle;
    }

    getPosition(time, angleOffset = 0) {
        let angleRadians = (this.getAngle(time) + angleOffset) * (Math.PI / 180);
        let distance = this.getDistance();

        let x = Math.sin(angleRadians) * distance
        let y = Math.cos(angleRadians) * distance;
        return { x: x, y: y };
    }

}



document.addEventListener('DOMContentLoaded', () => {
    planetsContainer = document.getElementById('planets-container');

    let maximiseButton = document.getElementsByClassName('planets-maximise-btn')[0];
    maximiseButton.addEventListener('click', () => {
        planetsContainer.classList.toggle('expanded');
        maximiseButton.classList.toggle('expanded');
    });

    let planetRenderer = new PlanetsRenderer();

    let timeSlider = document.getElementsByClassName('planet-time-slider')[0];
    timeSlider.addEventListener('input', () => {
        planetRenderer.realtime = false;
        planetRenderer.customTimeRate = timeSlider.value;
        planetRenderer.update();
    });

    let nowButton = document.getElementsByClassName('planet-time-now-btn')[0];
    nowButton.addEventListener('click', () => {
        planetRenderer.realtime = true;
        planetRenderer.updateDirty = true;
        planetRenderer.customTime = Date.now();
        timeSlider.value = 0;
    });

    
});