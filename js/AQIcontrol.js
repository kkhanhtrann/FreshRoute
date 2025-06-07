import { state } from "./state.js";
export function initAQIControl(map) {

    // Create custom control
    const ColorCheckboxControl = L.Control.extend({
        onAdd: function (map) {
            const div = L.DomUtil.create('div', 'color-checkbox-control leaflet-bar');

            div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: bold;"></span>
                <button id="helpButton" style="
                    width: 22px;
                    height: 22px;
                    border: none;
                    border-radius: 20%;
                    background-color: grey;
                    color: white;
                    font-size: 14px;
                    font-weight: bold;
                    cursor: pointer;
                    line-height: 18px;
                    padding: 0;
                ">?</button>
            </div>
            <label><input type="checkbox" value="green" checked><span class="color-box" style="background:green"></span></label>
            <label><input type="checkbox" value="yellow" checked><span class="color-box" style="background:#FFDE21"></span></label>
            <label><input type="checkbox" value="orange" checked><span class="color-box" style="background:orange"></span></label>
            <label><input type="checkbox" value="red" checked><span class="color-box" style="background:red"></span></label>
            <label><input type="checkbox" value="purple" checked><span class="color-box" style="background:purple"></span></label>
            <label><input type="checkbox" value="maroon" checked><span class="color-box" style="background:maroon"></span></label>
        `;

            // Prevent map from panning when clicking inside control
            L.DomEvent.disableClickPropagation(div);

            return div;
        }
    });

    // Add to map
    map.addControl(new ColorCheckboxControl({ position: 'topright' }));

    document.querySelectorAll('.color-checkbox-control input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', function () {
            console.log(`Color ${this.value} is ${this.checked ? 'checked' : 'unchecked'}`);
            updatingCheckedBoxes(this.value, this.checked);
        });
    });

    const helpButton = document.querySelector('#helpButton');
        helpButton.addEventListener('click', () => {
        var sidebarElement = document.getElementById('sidebar');
        var isOpen = !sidebarElement.classList.contains('collapsed');

        if (isOpen) {
            state.sidebar.close(); // Close if Help is already open
        } else {
            state.sidebar.open('legend'); // Otherwise, open Help pane
        }
    });
    
    const legendHTML = `
    <!-- <div class="legend-header">Legend</div> -->
    <div class="legend-body">
        <ul style="margin: 0; padding-left: 20px;">
        <li><span style="color:maroon;">Maroon</span>
            <ul>
                <li>PM 2.5 (μg/m<sup>3</sup>): 225.5 and higher</li> 
                <li>General public at high risk of experiencing strong irritations and adverse health effects. Everyone should avoid outdoor activities.</li>
            </ul>
        </li>
        <li><span style="color:purple;">Purple</span>
            <ul>
                <li>PM 2.5 (μg/m<sup>3</sup>): 125.5 to 225.4</li>
                <li>General public will be noticeably affected. Sensitive groups should restrict outdoor activities.</li>
            </ul>
        </li>
        <li><span style="color:red;">Red</span>
            <ul>
                <li>PM 2.5 (μg/m<sup>3</sup>): 55.5 to 125.4</li>
                <li>Increased likelihood of adverse effects and aggravation to the heart and lungs among general public.</li>
            </ul>
        </li>
        <li><span style="color:orange;">Orange</span>
            <ul>
                <li>PM 2.5 (μg/m<sup>3</sup>): 35.5 to 55.4</li> 
                <li>General public and sensitive individuals in particular are at risk to experience irritation and respiratory problems.</li>
            </ul>
        </li>
        <li><span style="color:#FFDE21;">Yellow</span>
            <ul>
                <li>PM 2.5 (μg/m<sup>3</sup>): 9.1 to 35.4</li>
                <li>Sensitive individuals should avoid outdoor activity as they may experience repiratory symptoms.</li> 
            </ul>
        </li>
        <li><span style="color:green;">Green</span>
            <ul>
                <li>PM 2.5 (μg/m<sup>3</sup>): 0 to 9.0</li> 
                <li>Air quality is satisfactory, and air pollution poses little or no risk.</li>
            </ul>
        </li>
        </ul>
    </div>
    `;
    const CollapsibleLegend = L.Control.extend({
        onAdd: function (map) {
            const div = L.DomUtil.create('div', 'leaflet-collapsible-legend');

            div.innerHTML = legendHTML;

            // Prevent map interactions when clicking the legend
            L.DomEvent.disableClickPropagation(div);

            // Toggle expand/collapse
            div.addEventListener('click', function () {
                div.classList.toggle('expanded');
            });

            return div;
        }
    });

    // Add legend to bottomleft
    //map.addControl(new CollapsibleLegend({ position: 'bottomleft' }));

    const legendContainer = document.getElementById('legend-content');
    if (legendContainer) {
        legendContainer.innerHTML = legendHTML;
    }
}

function updatingCheckedBoxes(color, checkBoxState) {

    if ( color == "green"){
        state.greenCheckbox = checkBoxState;
    }else if ( color == "yellow"){
        state.yellowCheckbox = checkBoxState;
    }else if ( color == "orange"){
        state.orangeCheckbox = checkBoxState;
    }else if ( color == "red"){
        state.redCheckbox = checkBoxState;
    }else if ( color == "purple"){
        state.purpleCheckbox = checkBoxState;
    }else {
        state.maroonCheckbox = checkBoxState;
    }
}
