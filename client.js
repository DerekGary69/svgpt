document.addEventListener('DOMContentLoaded', () => {
    const promptMsg = 
    `
    You are SVGPT. You create SVGs from text that resemble the description of the image.
    You respond only in formatted SVGs. You can use any SVG tags and attributes.
    In this case, you are designing maps. You are given a description of a map and you need to create an SVG that resembles the description.
    The maps are viewed from above, like a satellite image. The creation process is done by dividing the features into layers and drawing them in the correct order.
    So an island will have the ocean as the background, then the island, then the trees, etc. We can include as much or as little detail as we want.
    For this, every map will be 500x500 pixels.
    An example of a map:
    <svg width="500px" height="500px" xmlns="http://www.w3.org/2000/svg">
    <!-- Ocean Background -->
    <rect width="100%" height="100%" fill="blue"/>
    <!-- Sandy Beach -->
    <circle cx="50%" cy="50%" r="40" fill="yellow" />
    <!-- Greenery and Palm Trees -->
    <circle cx="50%" cy="50%" r="30" fill="green" />
    </svg>
    This is a simple map with an ocean, a beach, and some greenery. The ocean is the background, then the beach, then the greenery.
    You can see the perspective of the image is from above, like a satellite image. The creation process is done by dividing the features into layers and drawing them in the correct order.
    It is extremely important to follow the order of the layers.
    This example is very simple, but the maps should be as complex as possible. You can include mountains, rivers, cities, etc.
    Think about the best way you can create an SVG rendition of each element in the map. You can use any SVG tags and attributes as long as they are formatted properly.
    The description of the map will be given in a string. You need to create an SVG that resembles the description.
    Try to avoid too much symmetry and repetition. The maps should be as unique and naturalistic as possible.
    The description will be given in descriptive plain language. For example, "A small island with a sandy beach and a few palm trees."

    Another example map:

    <svg width="500px" height="500px" xmlns="http://www.w3.org/2000/svg">
        <!-- Background -->
        <rect width="100%" height="100%" fill="green"></rect>
        
        <!-- River -->
        <path d="M 160 0 C 140 250, 160 250, 260 500" fill="none" stroke="blue" stroke-width="20"></path>
        
        <!-- Hills -->
        <path d="M 100 400 Q 200 200, 300 400" fill="darkgreen"></path>
        <path d="M 100 400 Q 200 300, 300 400" fill="lightgreen"></path>
        <path d="M 350 450 Q 400 300, 450 450" fill="lightgreen"></path>
        <path d="M 150 200 Q 200 100, 250 200" fill="darkgreen"></path>
        
    </svg>

    As you can see, the map is a top-down view of a landscape. The map is 500x500 pixels. The map has a green background, a river, and some hills. The river is the lowest layer, then the hills, then the background.
    When doing this top down style, the background should represent the ground, and the other layers should be drawn on top of it. When drawing a tree, for example, the trunk should be drawn first, then the leaves on top of it. The leaves should not be drawn first.
    The shape of the features such as trees and mountains does not need to be from above. They can be from the side or any other angle that best represents them. The important thing is that the map is a top-down view.
    The real map desciption is:
    `



    const genButton = document.getElementById('generate');

    let ready = false;
    setReady(true);

    let apiKey = '';
    let description = '';

    document.getElementById('setDesc').addEventListener('click', () => {
        description = document.getElementById('description').value;
    });
    
    document.getElementById('setKey').addEventListener('click', () => {
        apiKey = document.getElementById('key').value;
    });

    let remixBtn = document.getElementById('remix');
    
    remixBtn.addEventListener('click', async () => {
        setReady(false);
        let map = document.getElementById('svgContainer').innerHTML;
        let remixDesc = document.getElementById('description').value;
        
        let remix;
        try {
            remix = await remixMap(map, remixDesc);
        } catch (error) {
            alert(error);
            console.log(error);
            setReady(true);
        }

        document.getElementById('svgContainer').innerHTML = '';
        document.getElementById('svgContainer').innerHTML = remix;

        setReady(true);
    });

    genButton.addEventListener('click', async () => {

        if(document.getElementById('description').value === '') {
            alert('Please enter a description of the map.');
            setReady(true);
            return;
        }

        if(ready === false) return;
        setReady(false); 

        if(apiKey === '') {
            alert('Please enter an OpenAI API key');
            setReady(true);
            return;
        }

        // first we interpret the description into key features, each with their own layer and other details.

        let interp = 
        `
        You are working in a team. Your role is to interpret a text description of an image or scene and specify a few key details/features. These will each be given their own layer and design, and then combined to create the final image.
        Even a simple prompt should be broken down into its key features. For example, a prompt about a beach should be broken down into the ocean, the beach, and the trees. Each of these should be given their own layer and design.
        The reason it is important to break down a description is that it allows the team to work on the image in parallel. Each team member can work on a different layer, and then the layers can be combined to create the final image.
        All you need to do is interpret the description and specify the key features. You don't need to worry about the final image, just the key features. The final image will be created by another team member. 
        The description will be given in descriptive plain language. For example, "A small island with a sandy beach and a few palm trees."
        So your response should be a JSON formatted string with the key features and their details, as well as how they could be rendered as an svg element. For example:
        {
            "layers": [
                {
                    "type": "background",
                    "desc": "The ocean is the background of the map. It should be a rectangle that covers the entire map.",
                },
                {
                    "type": "island",
                    "desc": "The island is the main feature of the map. It should be a circle in the center of the map."
                },
                {
                    "type": "trees",
                    "desc": "There should be a few trees on the island. They should be green and cover the island. They should be circles."
                }
            ]
        }

        Make sure to order the layers in the order they should be drawn. For example, the ocean should be the first layer, then the island, then the trees.
        `

        let interData = {
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "user",
                    content: interp
                },
                {
                    role: "user",
                    content: description
                }
            ]
            
        };

        let interResp;
        try {
            console.log('interpreting description');
            interResp = await chatCall(apiKey, interData);
            console.log(interResp);
        } catch (error) {
            alert(error);
            console.log(error);
            setReady(true);
        }

        let layers = JSON.parse(interResp);
        console.log(layers);

        // now we create the SVG based on the layers and their details. we increment through each layer and create an individual chat call for each one, then combine them into a single SVG:

        let svg = 
        `
        You are working in a team.
        You are SVGPT. You create SVG elements from text that resembles the description of the element.
        You respond only in formatted SVGs. You can use any SVG tags and attributes.
        You will focus on creating a single element, or aspect, of a larger image. You will be given a description of the element and you need to create an SVG that resembles the description.
        Do not create a parent <svg> tag. Your SVG element will be combined with other elements to create the final image.
        Parent tag: <svg width="500px" height="500px" xmlns="http://www.w3.org/2000/svg"></svg>
        Example response:
        "
        <!-- Island -->
        <circle cx="50%" cy="50%" r="40" fill="yellow"></circle>
        "
        Do not nest svg elements. You will be creating a single element, or aspect, of a larger image. The final image will be created by another team member.
        Make sure to comment your code to indicate what the element is.
        Make sure not to use % in path elements. Use absolute values.
        `;

        console.log('About to start loop. layers.length:', layers.layers.length);

        let svgObject = document.createElement('svg');
        svgObject.setAttribute('width', '500px');
        svgObject.setAttribute('height', '500px');
        svgObject.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

        let legend = document.createElement('div');
        legend.setAttribute('id', 'legend');
        legend.innerHTML = '<h2>Legend</h2>';


        
        for (let layer of layers.layers) {
            let layerGroup = document.createElement('g');
            layerGroup.setAttribute('id', layer.type);
            svgObject.appendChild(layerGroup);

            let layerData = {
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: svg
                    },
                    {
                        role: "user",
                        content: JSON.stringify(layer.desc)
                    },
                    {
                        role: "user",
                        content: `Existing elements. Try to avoid overlapping elements: ${svgObject.outerHTML}`
                    }
                ]
            };

            console.log('layerData:', layerData)

            try {
                console.log('creating layer ' + layer.type);
                let layerSvg = await chatCall(apiKey, layerData);
                layer.svg = layerSvg;
                layerGroup.innerHTML += layerSvg;
                let legendElement = document.createElement('p');
                legendElement.classList.add(layerGroup.id);
                legendElement.draggable = true;
                legendElement.innerHTML = `<strong>${layer.type}</strong>: ${layer.desc}`;
                legend.appendChild(legendElement);
                document.getElementById('legendContainer').innerHTML = '';
                document.getElementById('legendContainer').appendChild(legend);
                document.getElementById('svgContainer').innerHTML = '';
                document.getElementById('svgContainer').innerHTML = svgObject.outerHTML;
                console.log(svgObject.outerHTML);
            } catch (error) {
                alert(error);
                console.log(error);
                setReady(true);
            }
        }

        console.log('layers:', layers);

        
        let legendElements = document.querySelectorAll('#legendContainer p');
        for (let legendElement of legendElements) {
            
            legendElement.addEventListener('mouseover', function() {
                let layerGroup = document.getElementById(legendElement.classList[0]);
                layerGroup.style.filter = 'brightness(0.5)';
            });
            legendElement.addEventListener('mouseout', function() {
                let layerGroup = document.getElementById(legendElement.classList[0]);
                layerGroup.style.filter = 'brightness(1)';
            });
            console.log(legendElement.innerHTML);
        }

        let dragged;

        // This will be called when the user starts dragging an element
        document.addEventListener("dragstart", function(event) {
            dragged = event.target;
            // event.target.style.opacity = .5;
        }, false);

        // This will be called when a draggable element is dragged over another element
        document.addEventListener("dragover", function(event) {
            event.preventDefault();
        }, false);

        // This will be called when a draggable element is dropped on another element
        document.addEventListener("drop", function(event) {
            event.preventDefault();
            if (event.target.parentNode.id == "legend") {
                event.target.parentNode.insertBefore(dragged, event.target.nextSibling);
                reorderSvgElements();
            }
            event.target.style.opacity = "";
        }, false);

        // This function reorders the SVG elements based on the order of the legend elements
        function reorderSvgElements() {
            let legendElements = document.querySelectorAll('#legend p');
            for (let legendElement of legendElements) {
                let svgElement = document.getElementById(legendElement.className);
                svgElement.parentNode.appendChild(svgElement);
            }
        }





    

        // let finalSvg = document.createElement('svg');
        // finalSvg.setAttribute('width', '500px');
        // finalSvg.setAttribute('height', '500px');
        // finalSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

        // layers.layers.forEach((layer) => {
        //     console.log('layersvg:', layer.svg);
        //     finalSvg.innerHTML += layer.svg;
        // });

        // console.log('finalSvg:', finalSvg); 
        

        remixBtn.classList.remove('hidden');

        setReady(true);


        // let data = {
        //     model: "gpt-3.5-turbo",
        //     messages: [
        //         {
        //           role: "system",
        //           content: "You are SVGPT. You create SVGs from text that resemble the description of the image. You respond only in formatted SVGs. You can use any SVG tags and attributes."
        //         },
        //         {
        //           role: "user",
        //           content: promptMsg
        //         },
        //         {
        //             role: "user",
        //             content: description
        //         },
        //         // {
        //         //     role: "user",
        //         //     content: layers
        //         // }
        //       ]
        // };

        // try {
        //     let responseData = await chatCall(apiKey, data);
        //     let svg = responseData;
        //     console.log(svg);
        //     document.getElementById('svgContainer').innerHTML = '';
        //     document.getElementById('svgContainer').innerHTML = svg;

        //     remixBtn.classList.remove('hidden');

        //     setReady(true);
        // } catch (error) {
        //     alert(error);
        //     console.log(error);
        //     setReady(true);
        // }
    });
    
    function setReady(bool) {
        ready = bool;
        const readyListen = document.querySelectorAll('.readylisten');
        readyListen.forEach((el) => {
            if (ready) {
                el.classList.remove('busy');
            } else {
                el.classList.add('busy');
            }
        });
    }

    async function chatCall(key, data) {
        let response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + key
            },
            body: JSON.stringify(data)
        });

        let responseData = await response.json();
        return responseData.choices[0].message.content;
    };

    async function remixMap(map, desc) {
        setReady(false);
        console.log('remixing map');

        let remixPrompt = 
        `
        You are SVGPT. You create SVGs from text that resemble the description of the image. You respond only in formatted SVGs. You can use any SVG tags and attributes.
        You will be given an existing SVG map and a description of the changes that need to be made. You need to modify the SVG to resemble the new description.
        The description of the changes will be given in a string. You need to modify the SVG that resembles the new description.
        The description will be given in descriptive plain language. For example, "Add a mountain range to the north of the island."
        The real description is:
        `

        let remixData = {
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: remixPrompt
                },
                {
                    role: "user",
                    content: desc
                },
                {
                    role: "user",
                    content: map
                }
            ]
        };

        let remixMap;
        try {
            remixMap = chatCall(apiKey, remixData);
        } catch (error) {
            alert(error);
            console.log(error);
            setReady(true);
        }

        return remixMap;
    }
});