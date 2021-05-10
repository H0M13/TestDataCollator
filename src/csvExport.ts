import type { NodeResults } from "./commonTypes";
import fs from "fs";
import stringify from "csv-stringify";

export const exportAsCsv = (nodeResultsArray: Array<NodeResults>) => {

    let lines: (string | number)[][] = []

    nodeResultsArray.forEach(nodeResults => {

        const { identifier, results } = nodeResults

        results.forEach(result => {

            const { contentHash, result: { adult, suggestive, violence, visuallyDisturbing, hateSymbols } } = result

            lines.push([
                contentHash,
                identifier,
                adult,
                suggestive,
                violence,
                visuallyDisturbing,
                hateSymbols
            ])
        })
    })

    const columns = {
        contentHash: 'Content Hash',
        nodeIdentifier: 'Node Identifier',
        adult: 'Adult',
        suggestive: 'Suggestive',
        violence: 'Violence',
        visuallyDisturbing: 'Visually Disturbing',
        hateSymbols: 'Hate Symbols'
      };

    stringify(lines, { header: true, columns: columns }, (err, output) => {
        if (err) throw err;
        fs.writeFile('output/output.csv', output, 'utf8', function (err) {
            if (err) {
              console.log('Some error occurred - file either not saved or corrupted file saved.');
            } else{
              console.log('It\'s saved!');
            }
          });
      });


}