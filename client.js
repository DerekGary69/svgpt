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

    let pword = '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'


    const genButton = document.getElementById('generate');

    let ready = false;
    setReady(true);

    let apiKey = pword;
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

        // let data1 = {
        //     model: "gpt-3.5-turbo",
        //     messages: [
        //         {
        //           role: "user",
        //           content: "Given the following description of a landscape or image, decide on the key features that should be included in a simple SVG illustration that will use your output as a guide. Don't overdo it, as the capabilities are very limited. Be concise and stick to the description, but include some detail to give the SVG generator help. Do not include lighting information, sunlight, shadows or intangible atmospheric descriptions. Purely visual. Focus on key aspects, and suggest how the SVG agent could render each element with svg. A separate gpt agent will be used to generate the SVG from your output."
        //         },
        //         {
        //             role: "user",
        //             content: description
        //         }
        //     ]
        // };

        // let layers;
        // try {
        //     layers = await chatCall(apiKey, data1);
        //     console.log(layers);
        // } catch (error) {
        //     alert(error);
        //     console.log(error);
        //     setReady(true);
        // }

        let data = {
            model: "gpt-3.5-turbo",
            messages: [
                {
                  role: "system",
                  content: "You are SVGPT. You create SVGs from text that resemble the description of the image. You respond only in formatted SVGs. You can use any SVG tags and attributes."
                },
                {
                  role: "user",
                  content: promptMsg
                },
                {
                    role: "user",
                    content: description
                },
                // {
                //     role: "user",
                //     content: layers
                // }
              ]
        };

        try {
            let responseData = await chatCall(apiKey, data);
            let svg = responseData;
            console.log(svg);
            document.getElementById('svgContainer').innerHTML = '';
            document.getElementById('svgContainer').innerHTML = svg;

            remixBtn.classList.remove('hidden');

            setReady(true);
        } catch (error) {
            alert(error);
            console.log(error);
            setReady(true);
        }
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