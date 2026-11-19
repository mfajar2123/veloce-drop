---
lang: en
translationKey: background-removal-limits
title: What background removal can and cannot do for product photos
summary: Automatic segmentation is good at people and simple objects, and weak at hair, glass and products that blend into the background.
category: background
toolId: background
publishedAt: 2026-11-10
readingMinutes: 7
image: /images/articles/background-removal-limits.webp
imageAlt: "Softbox studio lighting kit for product photography"
imageCredit: "PhotoSEL LS21E52 Softbox Studio Lighting Kit (2) by Katie Chan"
imageCreditUrl: "https://commons.wikimedia.org/w/index.php?curid=30107820"
imageLicense: "by-sa 3.0"
related:
  - watermark-that-survives-resizing
  - compress-image-without-losing-quality
---

Removing a background used to require an hour of careful pen-tool work. Automatic segmentation now does it in seconds for many images. The gap between "many images" and "your image" is where the frustration lives.

## How the segmentation actually works

Doculven uses MODNet, a portrait matting model, running locally through ONNX Runtime. It predicts, for every pixel, how much it belongs to the foreground subject versus the background. The output is an alpha mask: opaque where the subject is, transparent where it is not, and partially transparent along soft edges.

That description already tells you the strengths and weaknesses. The model was trained primarily on people. It looks for a human figure, understands that hair has soft edges, and produces reasonable alpha around shoulders and arms.

## Where it works well

- **Portraits with clear separation.** A person against a wall, a street, or a park. High contrast between subject and background helps.
- **Single subject, centred.** The model expects a recognisable person occupying a meaningful portion of the frame.
- **Simple product photos** where the object is large, solid, and clearly distinct — a bottle on a white table, a shoe against a plain backdrop.

## Where it struggles

- **Hair against a busy background.** Fine strands are the hardest part of matting. Expect some loss or haloing; manual refinement helps.
- **Transparent or reflective objects.** Glass, clear plastic, and mirrors do not have a clean boundary. The model cannot know what is "behind" the object.
- **Products that share colour with the background.** A white shirt on a white wall has no edge to find.
- **Multiple subjects or unusual poses.** Trained patterns get less reliable.
- **Very small subjects** in a large frame — too few pixels to segment confidently.

## The refinement step is not optional

Automatic masks are a starting point, not a finished result. That is why the tool includes brushes for erasing and restoring parts of the mask, with undo.

Practical workflow:

1. Run the model once, accept the few seconds it takes.
2. **Zoom in on the edges** — the boundary is where every error lives.
3. Use a soft brush at moderate size to restore lost hair or fix a cut-off shoulder.
4. Use the eraser for background fragments the model kept.
5. Enable the **edge feather** setting: a small feather (1–3 px) hides hard mask edges and looks natural.
6. Only then export.

Skipping step 2 is the most common reason results look amateurish. At fit-to-screen zoom, a mask error is invisible; at 100%, it is obvious.

## Shadows and product photos

A cut-out product on a transparent background often looks like it is floating. The tool can generate a soft drop shadow beneath the subject, with configurable opacity, blur, and offset.

Two cautions:

- A shadow that is too strong reads as a rendering artifact rather than a photograph.
- Real shadows follow the light direction in the original photo. If the original has light from the left, an offset shadow to the right looks wrong.

## Resolution and detail loss

Segmentation runs on the image you provide. Very large images are downscaled for inference, then the mask is scaled back up. Fine detail near the edges can be softened by that round trip.

If edge quality matters, work at a moderate resolution rather than the maximum your camera produces. A 2000-pixel image with clean edges beats a 6000-pixel image with mushy ones.

## Privacy, in practical terms

Inference runs in your browser using a worker. The photo is not uploaded; the only network traffic is downloading the model itself, about 40 MB, once.

This matters for the obvious reason: product photos, ID cards, and portraits are exactly the images people should not upload to an unknown server. A local implementation removes that decision entirely.

## When not to use automatic removal

For a catalogue of hundreds of products on identical backgrounds, a studio setup with consistent lighting and a plain backdrop produces better, more consistent results than segmentation. Automatic removal is for the cases where reshoot is impractical.
