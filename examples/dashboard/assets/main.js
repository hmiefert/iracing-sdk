window.addEventListener("load", function(evt) {
    var connInteval
    console.log(ws_addr);
    ws = new WebSocket(ws_addr);
    ws.onopen = function(evt) {
        console.log("Websocket connection opened");
        clearInterval(connInteval);
        ws.send("");
    }
    ws.onclose = function(evt) {
        console.error("Websocket connection closed");
        connInteval = setTimeout(function() {
            _ws = ws
            ws = new WebSocket(ws_addr);                
            ws.onopen = _ws.onopen
            ws.onclose = _ws.onclose
            ws.onerror = _ws.onerror
            ws.onmessage = _ws.onmessage
            _ws = null
            console.log("Connection lost, reconnecting...");
        }, 5000)
        showFlash("Connection lost, reconnecting...");
    }
    ws.onerror = function(evt) {
        console.error("Websocket error.", evt.data);
    }
    ws.onmessage = function(evt) {
        data = JSON.parse(evt.data)
        if (!data.IsConnected) {
            showFlash("Waiting for iRacing connection...")
            return;
        }
        document.getElementById("flash").style.display = "none";
        updateWidget("info", data.Weather + "<br>" + "Air: " + data.TrackAirTemp.toFixed(0) + "C · Track: " + data.TrackSurfaceTemp.toFixed(0) + "C")
        if (data.DisplayUnits == "1") {
            fuel = data.FuelLevel.toFixed(2) + " L"
            speed = (data.Speed*3.6).toFixed(0) + " Kph"
        } else {
            fuel = (data.FuelLevel*0.264172).toFixed(2) + " gal"
            speed = (data.Speed*2.23694).toFixed(0) + " Mph"
        }
        gear = data.Gear
        if (gear == "0") gear = "N";
        if (gear == "-1") gear = "R";
        updateWidget("fuel", fuel)
        updateWidget("speed", speed)
        updateWidget("gear", gear)
        rpmLight(data.RPMLights, data.RPM.toFixed(0))
        updateWidget("rpm", data.RPM.toFixed(0))
        updateWidget("last-lap", floatToTime(data.LapLastLapTime, 3))
        updateWidget("best-lap", floatToTime(data.LapBestLapTime, 3))
        updateWidget("position", data.PlayerCarClassPosition)
        remain = data.SessionTimeRemain == 604800 ? "<em>&infin;</em>" : floatToTime(data.SessionTimeRemain, 0)
        updateWidget("remaining", remain)
        pitLimiter(data.EngineWarnings)
    }
});
function updateWidget(name, value) {
    document.querySelector("#"+name+" p").innerHTML = value;
}
function showFlash(msg) {
    document.getElementById("flash").innerHTML = msg;
    document.getElementById("flash").style.display = "block";        
}
function floatToTime(time, precision) {
    lapTime = parseFloat(time).toFixed(precision)
    if (lapTime >= 60) {                
        minutes = Math.floor(lapTime / 60)
        seconds = (lapTime - minutes * 60).toFixed(precision)
        if (seconds < 10) seconds = "0" + seconds
        lapTime = minutes + ":" + seconds
    }
    return lapTime
}
function rpmLight(limits, rpm){
    document.getElementById("rpm").classList.remove("blink", "change", "first");
    document.getElementById("overlay").classList.remove("change", "blink")
    if (parseFloat(rpm) > parseFloat(limits.Blink)) {
        document.getElementById("rpm").classList.add("blink");
        document.getElementById("overlay").classList.add("blink");
        return;
    }
    if (parseFloat(rpm) > parseFloat(limits.Last)) {
        document.getElementById("rpm").classList.add("change");
        document.getElementById("overlay").classList.add("change");
        return;
    }
    if (parseFloat(rpm) > parseFloat(limits.First)) {
        document.getElementById("overlay").classList.add("change");
        return;
    }
}
function pitLimiter(engineWarnings) {
    if (engineWarnings.indexOf("0x1") == 0 || engineWarnings.indexOf("0x3") == 0) {
        document.getElementById("overlay").className = "pit-limiter";
    } else {
        document.getElementById("overlay").classList.remove("pit-limiter");
    }
}