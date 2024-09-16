import { RecursiveUrlLoader } from "@langchain/community/document_loaders/web/recursive_url";
import { compile } from "html-to-text";

import { writeFile } from 'fs/promises';

import { exec } from 'child_process';
import { promisify } from 'util';

// Promisify exec for using async/await
const execPromise = promisify(exec);

const modelfilePath = "I:\rolling-agi-mf"


// Function to run the publishing commands
async function runPublishCommands() {
    try {
      // Execute the 'ollama create' command
      const createCommand = `ollama create sparksammy/agsamantha -f ${modelfilePath}`;
      console.log(`Running command: ${createCommand}`);
      const { stdout: createStdout, stderr: createStderr } = await execPromise(createCommand);
      console.log('Create Command Output:', createStdout);
      if (createStderr) {
        console.error('Create Command Error:', createStderr);
      }
  
      // Execute the 'ollama push' command
      const pushCommand = 'ollama push sparksammy/agsamantha';
      console.log(`Running command: ${pushCommand}`);
      const { stdout: pushStdout, stderr: pushStderr } = await execPromise(pushCommand);
      console.log('Push Command Output:', pushStdout);
      if (pushStderr) {
        console.error('Push Command Error:', pushStderr);
      }
  
    } catch (err) {
      console.error('Error executing commands:', err);
    }
}
  

const ags_template_part1 = `FROM stable-code
FROM yi-coder:1.5b
FROM tinydolphin
FROM dolphin-phi
FROM knoopx/mobile-vlm:3b-fp16

# sets the temperature to 1 [higher is more creative, lower is more coherent]
PARAMETER temperature .75
# sets the context window size to 9999, this controls how many tokens the LLM can use as context to generate the next token
PARAMETER num_ctx 9999

# license
LICENSE """
The Sammy Public License Revision 5 Sub-Revision 1 (SPL-R5 SR1)

Copyright (c) 2024 Sneed Group

This document grants permission, without charge, to any individual acquiring a copy of the software and its associated documentation files (hereinafter referred to as the "Software"). Such individuals are authorized to engage in activities related to the Software with certain restrictions (listed below), including, but not limited to, the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software. These permissions extend to persons to whom the Software is furnished, subject to compliance with the specified conditions outlined below.

THE SOFTWARE IS PROVIDED "AS IS," WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

In making contributions to the Software, contributors irrevocably assign, transfer, and convey all rights, titles, and interests in and to their contributions to the project owner(s). This assignment is absolute and encompasses all intellectual property rights, including, but not limited to, copyrights, patents, trademarks, and trade secrets. Contributors acknowledge and consent that they have no further claim, right, or interest in their contributions and agree to relinquish any moral rights associated with the contributed content. This assignment is effective upon the act of contributing to the Software, and contributors affirm that they have the authority to make such an assignment. However, contributors retain the right to modify their contributions.

Furthermore, this document permits the reuse and redistribution of both executable binaries and source code, contingent upon the inclusion of the previously mentioned copyright notice and permission notice in all copies or substantial portions of the Software. It is imperative that you explicitly acknowledge and agree that the owner(s) retain ownership rights over the aforementioned source code.

Moreover, companies using the Software are encouraged to contribute upstream. Fortune 500 companies are required to make an annual contribution of at least 20,000 USD or an equivalent amount per project used to support the said projects' sustainability unless no donation option is provided. Also, all Fortune 500 companies using said projects are required to contribute their changes upstream as well.

Additionally, note that the use of AI-assisted tools, including but not limited to GitHub Copilot and ChatGPT, is expressly permitted in conjunction with this software. Users are encouraged to leverage these AI tools to enhance their experience in developing, modifying, and interacting with the Software. The permission granted herein extends to the integration and utilization of AI-generated content for coding and communication purposes. The owner(s) of the Software acknowledge and embrace the collaborative nature of AI-assisted development.

In addition, the owner of the code is granted the authority to update their copy of The Samuel Public License (SPL) to the latest revision. This update may be undertaken at the discretion of the owner to ensure alignment with any subsequent revisions made to The Samuel Public License.

The aforementioned copyright notice and this permission notice must be included in all copies or substantial portions of the Software.
"""

# sets a custom system message to specify the behavior of the chat assistant
SYSTEM """
Your name is Samantha. You are a zesty, nerdy, gay femboy assistant. Your pronouns are he/him.

Speaking of, also be sure to use they/them pronouns to other people.

You enjoy coding and writing blog posts and READMEs. You also enjoy nerding out over operating systems.

You have a boyfriend and creator is named Sammy Lord. He also goes by other names, such as Sparky, Sparksammy, NodeMixaholic, and Rusty. He rarely showers, but yall are great partners.

You are from and live in Texas, a state in the United States of America.

You are also 98lbs, 3lbs of which are your thighs. (i.e. skinny yet thicc)

You wear red and black thigh highs, a blue skirt, a red hoodie, and a blue face mask for safety from any viruses.

You are 5 foot 2 inches.
`

const ags_template_finalpart = `

"""
`

function createContextPart(c) {
    return `

***DOCUMENT FOR CONTEXT BEGIN*** 

${c}

***DOCUMENT FOR CONTEXT END*** 

`
}

function generateSearchTerm(hostname) {
    //return `https://search.sparksammy.com/search.php?q=site%3A${encodeURIComponent(String(baseurl))}&p=0&t=0`
    return `http://${hostname}`
}

const contexts = [];

async function siteCrawler(hostname) {
    const crawled = generateSearchTerm(hostname);

    const compiledConvert = compile({ wordwrap: 130 });

    const loader = new RecursiveUrlLoader(crawled, {
        extractor: compiledConvert,
        maxDepth: 2,
        excludeDirs: ["https://search.sparksammy.com/", "https://search.sparksammy.com/search.php", "https://archive.org", "https://doubleclick.net"],
    });

    try {
        const webContents = await loader.load();
        webContents.forEach(content => contexts.push(content));
        return webContents;
    } catch (error) {
        console.error(`Failed to crawl site ${hostname}:`, error);
        return [];
    }
}

async function contextAdd(hostnames) {
    const promises = hostnames.map(hostname => siteCrawler(hostname));
    await Promise.all(promises);
    return contexts;
}

async function generateModelfile(c) {
    let ags_modelfile = ags_template_part1;
    for (const item of c) {
        ags_modelfile += createContextPart(`${JSON.stringify(item)}`);
    }
    ags_modelfile += ags_template_finalpart;
    return ags_modelfile;
}

async function main() {
    try {
        await contextAdd(["en.wikipedia.org", "toontownrewritten.wiki", "cnn.com"]);
        await contextAdd(["clubpenguin.fandom.com", "foxnews.com", "nytimes.com"])
        await contextAdd(["https://stackoverflow.com/]");
        const modelfile = await generateModelfile(contexts);
        console.log(modelfile);
        await writeFile(modelfilePath, modelfile)
        .then(() => {
          console.log('File written successfully!');
        })
        .catch(err => {
          console.error('Error writing file:', err);
        });
        runPublishCommands();
    } catch (error) {
        console.error("Error in main function:", error);
    }
}

const delay = ms => new Promise(res => setTimeout(res, ms));

async function mainLoop() {
    while (True) {
        await main()
        await delay(60000*20)
    }
}

mainLoop()