import { Path, Tool, setup, PointText, Point, Rectangle, PathItem, CompoundPath } from "paper";

window.onload = () => {
    const canvas: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById('content');
    if (!canvas) {
        throw new Error('Could not find canvas named content in document!');
    }

    setup(canvas);

    // Create a simple drawing tool:
    const tool: Tool = new Tool();
    let path: Path;
    let circle: Path;

    const textItem = new PointText({
        content: 'Click and drag to draw a line.',
        point: new Point(20, 30),
        fillColor: 'black',
    });

    const textCircle = new PointText({
        content: '0%',
        point: new Point(20, 70),
        fillColor: 'black',
        fontSize: 24,
    });

    // new Path.Circle({
    //     center: new Point(800, 500),
    //     radius: 200,
    //     strokeColor: 'black'
    // });

    // Define a mousedown and mousedrag handler
    tool.onMouseDown = (event) => {
        // If we produced a path before, deselect it:
        if (path) {
            path.remove();
            circle.remove();
        }

        // Create a new path and set its stroke color to black:
        path = new Path({
            segments: [event.point],
            strokeColor: 'black',
            strokeWidth: 5,
        });
    }

    tool.onMouseDrag = (event) => {
        path.add(event.point);

        // Update the content of the text item to show how many
        // segments it has:
        textItem.content = 'Segment count: ' + path.segments.length;
    }

    tool.onMouseUp = (event) => {
        path.closePath();

        const segmentCount = path.segments.length;

        // When the mouse is released, simplify it:
        path.simplify(10);

        // Select the path, so we can see its segments:
        // path.fullySelected = true;

        // const newSegmentCount = path.segments.length;
        // const difference = segmentCount - newSegmentCount;
        // const percentage = 100 - Math.round(newSegmentCount / segmentCount * 100);
        // textItem.content = difference + ' of the ' + segmentCount + ' segments were removed. Saving ' + percentage + '%';

        const bounds = path.bounds.clone();

        const calculateCircleExclusionAreaWithPath = (center: Point, radius: number): number => {
            const exclusionCircle = new Path.Circle({
                center: center,
                radius: radius,
            });

            const resultPath = exclusionCircle.exclude(path);
            resultPath.visible = false;

            exclusionCircle.remove();

            let totalArea = 0;
            if (resultPath instanceof CompoundPath) {
                for (const child of resultPath.children) {
                    if (child instanceof Path) {
                        totalArea += Math.abs((child as Path).area);
                    } else {
                        console.warn(`Child is not instance of Path: ${child}`);
                    }
                }

                return totalArea;
            } else {
                console.warn(`Result is not instance of CompoundPath: ${resultPath}`);
            }
            return -1;
        }

        const center = bounds.center;
        const width = bounds.width / 2;
        const height = bounds.height / 2;

        const widthArea = calculateCircleExclusionAreaWithPath(center, width);
        const heightArea = calculateCircleExclusionAreaWithPath(center, height);

        console.log(`widthArea = ${widthArea}, heightArea = ${heightArea}`);

        if (widthArea >= heightArea) {
            circle = new Path.Circle({
                center: center,
                radius: width,
                strokeColor: 'green',
            });
            console.log("Picked width area");
        } else {
            circle = new Path.Circle({
                center: center,
                radius: height,
                strokeColor: 'green',
            });
            console.log("Picked height area");
        }


        const totalArea = Math.max(widthArea, heightArea);
        const percentage = totalArea < 0 ? 0 : ((circle.area - totalArea) * 100 / circle.area);
        textCircle.content = percentage.toFixed(2).toString() + '%';

        const setColor = (color: string) => {
            textCircle.strokeColor = color;
            textCircle.fillColor = color;
        };
        if (percentage > 99) {
            setColor('lime');
        } else if (percentage > 80) {
            setColor('blue');
        } else if (percentage > 50) {
            setColor('purple');
        } else if (percentage > 20) {
            setColor('yellow')
        } else {
            setColor('red')
        }
    }
};
